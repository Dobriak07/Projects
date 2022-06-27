# REST API
## Общая информация
### Термины
* archive detection - захват;
* archive detection image - изображение захвата;
* spotter list - контрольный список;
* spotter person - персона;
* spotter match - сопоставление;
* spotter list change - запись истории изменений;
* acs card holder - держатель карты;
* acs verification - запись верификации прохода;
* acs match - сопоставление со списком СКУД.

### Примечание по поводу timestamp
Текущая реализация не поддерживает в качестве входных параметров timestamp
в формате RFC3339 с суффиксом Z. Суффикс Z можно заменить на +00:00.

### Описание ошибок
Ниже ошибки описаны кратко следующий образом:
* 422 sample_error - <описание ошибки>:
    * additional_field - <описание дополнительного поля>.

Такое описание означает, что система вернет следующий ответ в ситуации,
описанной в описании ошибки:
```
422 Unprocessable Entity
Content-Type: application/json

{
  "status": "error",
  "error": "sample_error",
  "additional_field": "additional_field_value"
}
```

Если запрос возвращает ошибки в другом формате, об этом говорится отдельно.

### Pagination
Для постарничного возврата результатов используется пагинация. Для этого
передаются следующие query parameters:
* limit - число записей на странице;
* offset - номер первой записи на странице в 0-индексации.

Например, для получения первых 10-ти записей: limit=10&offset=0

В поле _pagination ответа указываются:
* total_records - общее число записей в коллекции;
* prev_link - ссылка на предыдущие limit записей или null, если текущая страница первая;
* next_link - ссылка на следующие limit записей или null, если текущая страница последняя.

Например для страницы limit=2&offset=10:
* prev_link - limit=2&offset=8;
* next_link - limit=2&offset=12.

### Query string параметры
Для передачи строк в query string параметры используется UTF-8 кодировка.

### Liveness
Информация о liveness выдается в виде следующей JSON структуры:
```
{
  "score": 0.8,
  "is_spoofing": false
}
```
* score (float, nullable) - уверенность в том, что на фото изображение живого
  человека; может быть null, если для трэка ещё не производилось вычисление
  liveness;
* is_spoofing (boolean, nullable) - true, если имеется факт подмены, то есть
  значение score ниже установленного для потока обработки порога; может быть
  null, если для кадров трэка ещё не производилось вычисление liveness;

Если для потока обработки механизм liveness выключен, то вместо описанной выше
структуры выдается null.

## Архив: получение списка захватов
**POST** /v1/archive?action=list&limit=<limit>&offset=<offset>

### Пример запроса
```
POST /v1/archive?action=list&limit=2&offset=10
Content-Type: application/json

{
  "feeds": ["feed 0", "feed 2"],
  "min_timestamp": "2019-01-21T17:00:00+03:00",
  "max_timestamp": "2019-01-31T00:00:00+03:00",
  "min_confidence": 0.85,
  "mask": [null, "LOWER_FACE_MASK", "FULL_FACE_MASK"],
  "spoofing": [null, true],
  "no_match": [null, true]
}
```

Поле min_confidence является опциональным.

Захваты, содержащие null в столбце confidence, не войдут в результат запроса,
в котором использовалось поле min_confidence.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "detections": [
    {
      <захват (см. формат "Архив: получение захвата")>
    },
    {
      <захват (см. формат "Архив: получение захвата")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/archive?limit=2&offset=8",
    "next_link": "/v1/archive?limit=2&offset=12"
  }
}
```

### Ошибки
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку.


## Архив: поиск лица с изображения
**POST** /v1/archive?action=search

### Формат запроса
Запрос подается в формате multipart/form-data из двух частей.

Часть с именем *query* содержит параметры поиска:
* feeds (list of string) - список имен потоков обработки, для архивов которых
  необходимо произвести поиск;
* min_timestamp (timestamp) - начало временного интервала для поиска;
* max_timestamp (timestamp) - конец временного интервала для поиска;
* min_similarity (number) - минимальная похожесть при сравнении лиц;
* hint_bbox (object) - местоположение ограничивающего лицо прямоугольника на
  переданном изображении.

Поле hint_bbox опциональное. Если не указано, то поиск лица производится на
всем изображении. Если указано, то из всех найденных лиц выбирается то,
ограничивающий прямоугольник которого имеет наибольший IOU (Intersection Over
Union) c hint_bbox. При этом рассматриваются только те лица, которые имеют IOU
с hint_bbox не ниже значения, заданного в конфигурационном поле
worker_service_hint_bbox_iou_threshold.

Часть с именем *image* содержит код изображения, закодированного с помощью JPEG.

### Пример запроса
```
POST /v1/archive?action=search
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="query"
Content-Type: application/json

{
  "feeds": ["feed 0", "feed 2"],
  "min_timestamp": "2019-01-21T17:00:00+03:00",
  "max_timestamp": "2019-01-31T00:00:00+03:00",
  "min_similarity": 0.97,
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "availability": {
    "number_of_not_indexed_records": 25
  },
  "matches": [
    {
      "similarity": 0.99,
      "detection": {
        <захват (см. формат для "Архив: получение захвата")>
      }
    },
    {
      "similarity": 0.97,
      "detection": {
        <захват (см. формат для "Архив: получение захвата")>
      }
    }
  ]
}
```

number_of_not_indexed_records - число записей архива, подпадающих под критерии
поиска, для которых нет построенного дескриптора актуальной версии.

### Примечания
Результат поиска по архиву потенциально может содержать большое количество
записей.

Archive search could be incomplete because of FR algorithm upgrade and
incompleted reindexing. Availability field indicates this situation and number
of missed out records.

We do not implement persistency here, so no pagination will be possible. This
might cause some problems due to large outputs.

Note that there many feed servers. A single server will handle some feeds. A
wide search is likely to be done by querying multiple feed servers.

Feeds can be processed by different servers at different times. So, local
archive db could contain detections from feeds that are not currently being
processed.

Найти hint_bbox для изображений, которые возвращает FaceXServer, можно с
помощью запросов на получение аннотированного изображения.

### Ошибки
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 422 image_decode_error - ошибка раскодирования переданного JPEG кода;
* 422 multiple_faces_found - на переданном изображении найдено несколько лиц;
* 422 no_faces_found - на переданном изображении не найдено лиц;
* 422 face_did_not_pass_filters - на переданном изображении найдено лицо,
  но оно не прошло либо Detection Filter, либо FFD Filter;
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 invalid_json - часть, содержащая JSON, содержит некорректный JSON;
* 422 missing_parameter - не найден параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение.


## Архив: получение захвата
**GET** /v1/archive/detection/<detection_id>

### Формат ответа
Ответ содержит JSON со следующими полями:
* id (integer) - уникальный идентификатор захвата;
* feed (string) - имя потока обработки;
* timestamp (timestamp) - время, соответствующее захвату лица;
* bounding_box (object) - местоположение ограничивающего лицо прямоугольника в
  кадре:
    * x (number) - относительная X координата левого верхнего угла;
    * y (number) - относительная Y координата левого верхнего угла;
    * w (number) - относительная ширина;
    * h (number) - относительная высота;
* track_start_timestamp (timestamp) - время начала трэка;
* track_finish_timestamp (timestamp) - время конца трэка;
* attributes (object) - аттрибуты лица:
    * facial_hair (string) - тип волос на лице: UNKNOWN, BEARD, BRISTLE, GM,
      GOATEE, MUSTACHE, SHAVED;
    * glasses (string) - очки: UNKNOWN, DARK, NONE, USUAL;
    * hair_color (string) - цвет волос: UNKNOWN, BLACK, BLOND, BROWN, FAIR,
      GRAY;
    * hair_type (string) - тип волос: UNKNOWN, BALD, HIGH_TEMPLE, NORMAL;
    * headwear (string) - головной убор: UNKNOWN, B_CAP, BAND, BERET, CAP,
      EAR_FLAP, FUR_HOOD, GLASSES, HAT, HELMET, HOOD, KEPI, KERCHIEF, NO,
      PEAKED_CAP;
* demographics (object) - демографическая информация:
    * age (object) - объект, описывающий возраст:
        * mean (number) - среднее значение;
        * variance (number) - дисперсия;
    * ethnicity (string) - раса: UNKNOWN, ASIAN, BLACK, CAUCASIAN, EAST_INDIAN;
    * gender (string) - пол: UNKNOWN, FEMALE, MALE;
* mask (string, nullable) - наличие маски на лице (null в случае если классификация на наличие маски не применялась):
    * NO_MASK - нет маски;
    * LOWER_FACE_MASK - медицинская маска или подобные;
    * FULL_FACE_MASK - лыжная маска, балаклава или подобные;
    * OTHER_MASK - другие типы масок;
  Если алгоритм обнаружил маску, которая неправильно надета (см. поле is_mask_dressed_correctly ниже), то в
  данном поле будет записано значение NO_MASK.
* is_mask_dressed_correctly_confidence (number, nullable) - уверенность алгоритма в том, что маска закрывает нос и рот человека
  (null в случае если классификация на наличие маски не применялась или маска не была обнаружена);
* is_mask_dressed_correctly (boolean, nullable) - решение о том, правильно ли надета маска.
  Является результатом сравнения is_mask_dressed_correctly_confidence с пороговым значением, заданным в конфигурационном поле
  is_mask_dressed_correctly_threshold
  (null в тех же случаях, когда поле is_mask_dressed_correctly_confidence равно null);
* yaw (number) - yaw угол наклона головы;
* pitch (number) - pitch угол наклона головы;
* liveness (object, nullable) - информация о liveness (см. "Liveness");
* confidence (number) - уверенность алгоритма в том, что было найдено лицо человека;
* no_match (boolean, nullable) - отсутствие совпадения с контрольными списками и списком СКУД
  (null для случаев, когда трэк еще в обработке, и для legacy захватов, для которых проверка
  на совпадение со списками не проводилась);
* _links (object) - ссылки на сопутствующие объекты:
    * _self (string) - ссылка на этот захват;
    * detection_image (string) - ссылка на изображение лица, соответствующее
      захвату.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "feed": "feed 0",
  "timestamp": "2019-01-31T00:00:00Z",
  "bounding_box": {
    "x": 0.1,
    "y": 0.2,
    "w": 0.9,
    "h": 0.8
  },
  "track_start_timestamp": "2019-01-30T00:00:00Z",
  "track_finish_timestamp": "2019-02-01T00:00:00Z",
  "attributes": {
    "facial_hair": "SHAVED",
    "glasses": "NONE",
    "hair_color": "FAIR",
    "hair_type": "NORMAL",
    "headwear": "NO"
  },
  "demographics": {
    "age": {
      "mean": 40.62773132324219,
      "variance": 45.96840286254883
    },
    "ethnicity": "EAST_INDIAN",
    "gender": "MALE"
  },
  "mask": "LOWER_FACE_MASK",
  "is_mask_dressed_correctly_confidence": 0.9996510148048401,
  "is_mask_dressed_correctly": true,
  "yaw": 3.0,
  "pitch": -0.04,
  "confidence": 0.99,
  "no_match": false,
  "liveness": { <информация о liveness (см. "Liveness")> },
  "_links": {
    "_self": "/v1/archive/detection/42",
    "detection_image": "/v1/archive/detection/42/image"
  }
}
```

### Ошибки
* 404 not_found - захват с заданным уникальным идентификатором не найден.


## Архив: получение изображения захвата
**GET** /v1/archive/detection/<detection_id>/image

### Формат ответа
Ответ содержит закодированное в JPEG изображение захваченного лица.

### Ошибки
Данный запрос в случае ошибки возвращает не JSON, а пустое тело с указанными
ниже кодами:
* 404 - захват не найден.


## Архив: получение аннотированного изображения захвата
**GET** /v1/archive/detection/<detection_id>/annotated_image

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
Данный запрос в случае ошибки возвращает не JSON, а пустое тело с указанными
ниже кодами:
* 404 - захват не найден.


## Контрольные списки: получение списка контрольных списков
**GET** /v1/spotter/list?limit=<limit>&offset=<offset>&search=<query>

Параметр запроса search опциональный. Если он задан, то для выданных контрольных
списков верно следующее: каждое слово из параметра входит как подстрока в поле
name. Поиск подстроки регистронезависимый. Слова в параметре разделяются
пробелом.

### Пример запроса
```
GET /v1/spotter/list?limit=2&offset=10&search=mywatchlist+%D0%B8%D0%B2%D0%B0%D0%BD
```

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "lists": [
    {
      <контрольный список (см. формат "Контрольные списки: получение контрольного списка")>
    },
    {
      <контрольный список (см. формат "Контрольные списки: получение контрольного списка")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/spotter/list?limit=2&offset=8&search=mywatchlist+%D0%B8%D0%B2%D0%B0%D0%BD8",
    "next_link": "/v1/spotter/list?limit=2&offset=12&search=mywatchlist+%D0%B8%D0%B2%D0%B0%D0%BD"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: создание контрольного списка
**POST** /v1/spotter/list?operator=<op_name>

### Пример запроса
```
POST /v1/spotter/list?operator=SampleOp
Content-Type: application/json

{
  "name": "name of the new list",
  "priority": 10,
  "match_threshold": 0.8,
  "notes": "some notes"
}
```

### Пример ответа
```
201 CREATED
Location: /v1/spotter/list/42
Content-Type: application/json

{
  <контрольный список только с полями: id, _links
   (см. формат "Контрольные списки: получение контрольного списка")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: получение контрольного списка
**GET** /v1/spotter/list/<list_id>

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "name": "sample list",
  "priority": 10,
  "match_threshold": 0.97,
  "notes": "some notes",
  "creation_timestamp": "2019-01-21T17:00:00+03:00",
  "update_timestamp": "2019-01-21T18:00:00+03:00",
  "persons_count": 2,
  "_links": {
    "_self": "/v1/spotter/list/42",
    "persons": "/v1/spotter/list/42/persons"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - контрльная список не найден;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: добавление персоны в контрольный список
**POST** /v1/spotter/list/<list_id>?action=include_person&operator=<op_name>

### Пример запроса
```
POST /v1/spotter/list/42?action=include_person&operator=SampleOp
Content-Type: application/json

{
  "person_id": N
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - контрольная список не найден;
* 422 no_such_person_id - персона с заданным уникальным идентификатором не
  найдена;
* 422 already_in_list - персона уже находится в требуемом списке;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: удаление персоны из контрольного списка
**POST** /v1/spotter/list/<list_id>?action=exclude_person&operator=<op_name>

Если персона после операции не состоит в каком-либо из контрольных списков,
то она удаляется. Такое удаление не отражается в истории изменений.

### Пример запроса
```
POST /v1/spotter/list/42?action=exclude_person&operator=SampleOp
Content-Type: application/json

{
  "person_id": N
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - контрольный список не найден;
* 422 no_such_person_id - персона с заданным уникальным идентификатором не
  найдена;
* 422 not_in_list - персона не находится в данном контрольном списке;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: изменение контрольного списка
**PATCH** /v1/spotter/list/<list_id>?operator=<op_name>

### Пример запроса
```
PATCH /v1/spotter/list/42?operator=SampleOp
Content-Type: application/json

{
  "name": "new name",
  "priority": 12,
  "match_threshold": 0.99
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_operator_name - не передан query string параметр operator;
* 404 not_found - контрольный список не найден;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: удаление контрольного списка
**DELETE** /v1/spotter/list/<list_id>?operator=<op_name>

Все персоны, которые находились только в удаляемом контрольном списке, будут
удалены. Такие удаления не отражаются в истории изменений.

### Пример запроса
```
DELETE /v1/spotter/list/42?operator=SampleOp
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_operator_name - не передан query string параметр operator;
* 404 not_found - контрольный список не найден;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: получение списка персон из контрольного списка
**GET** /v1/spotter/list/<list_id>/persons?limit=<limit>&offset=<offset>&search=<query>&order_by=<order_by>

Параметр запроса search опциональный. Если он задан, то для выданных персон
верно следующее: каждое слово из параметра входит как подстрока в одно из полей
персоны: first_name, middle_name, last_name, external_id. Поиск подстроки
регистронезависимый. Слова в параметре разделяются пробелом.

Параметр запроса order_by опциональный. Он задает сортировку выдаваемого списка.
Может принимать одно из значений: <field>_asc, <field>_desc, где field это одно
из: id, external_id, first_name, middle_name, last_name. <field>_asс сортирует
по полю <field> по возрастанию, <field>_desc по убыванию. Если параметр не
задан, то список сортируется по возрастанию id.

### Пример запроса
```
GET /v1/spotter/list/36/persons?limit=2&offset=10&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc
```

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "persons": [
    {
      <персона (см. формат "Контрольные списки: получение персоны")>
    },
    {
      <персона (см. формат "Контрольные списки: получение персоны")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/spotter/list/36/persons?limit=2&offset=8&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc",
    "next_link": "/v1/spotter/list/36/persons?limit=2&offset=12&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - контрольный список не найден;
* 422 no_such_order_by - передан недопустимый параметр order_by;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: добавление персоны
**POST** /v1/spotter/person?action=create&operator=<op_name>

### Пример запроса
```
POST /v1/spotter/person
Content-Type: application/json

{
  "first_name": "Ivan",
  "middle_name": "Ivanovich",
  "last_name": "Ivanov",
  "notes": "some notes about person",
  "external_id": "some external_id",
  "list_id": 20
}
```

Любое из полей, кроме list_id, может быть пропущено. В этом случае:
* first_name, middle_name, last_name, external_id будут null;
* notes будет пустой строкой.

list_id задает контрольный список, в который будет помещена персона.

### Пример ответа
```
201 CREATED
Location: /v1/spotter/person/42
Content-Type: application/json

{
  <персона только с полями id, _links
   (см. формат "Контрольные списки: получение персоны")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 no_such_list_id - список с заданным уникальным идентификатором не найден;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: поиск персон по фото
**POST** /v1/spotter/person?action=search_by_image

### Пример запроса
```
POST /v1/spotter/person?action=search_by_image
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "lists": [10, 23],
  "min_similarity": 0.8,
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

Поле lists опциональное. Если не указано, то поиск производится среди всех
персон.

Поле hint_bbox опциональное. Если не указано, то поиск лица производится на
всем изображении. Если указано, то из всех найденных лиц выбирается то,
ограничивающий прямоугольник которого имеет наибольший IOU (Intersection Over
Union) c hint_bbox. При этом рассматриваются только те лица, которые имеют IOU
с hint_bbox не ниже значения, заданного в конфигурационном поле
worker_service_hint_bbox_iou_threshold.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "availability": {
    "number_of_not_indexed_records": 25
  },
  "matches": [
    {
      "person": {
        <персона (см. формат "Контрольные списки: получение персоны")>
      },
      "matched_faces": [
        {
          "similarity": 0.9,
          "face_image: {
            "id": 23,
            "_links": {
              "source": "/v1/spotter/face/23"
            }
          }
        },
        {
          "similarity": 0.8,
          "face_image: {
            "id": 24,
            "_links": {
              "source": "/v1/spotter/face/24"
            }
          }
        }
      ]
    },
    {
      "person": {
        <персона (см. формат "Контрольные списки: получение персоны")>
      },
      "matched_faces": [
        {
          "similarity": 0.99,
          "face_image: {
            "id": 23,
            "_links": {
              "source": "/v1/spotter/face/25"
            }
          }
        }
      ]
    }
  ]
}
```

number_of_not_indexed_records - число лиц персон, подпадающих под критерии
поиска, для которых нет построенного дескриптора актуальной версии.

### Ошибки
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 422 image_decode_error - ошибка раскодирования переданного JPEG кода;
* 422 multiple_faces_found - на переданном изображении найдено несколько лиц;
* 422 no_faces_found - на переданном изображении не найдено лиц;
* 422 face_did_not_pass_filters - на переданном изображении найдено лицо,
  но оно не прошло либо Detection Filter, либо FFD Filter;
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 invalid_json - часть, содержащая JSON, содержит некорректный JSON;
* 422 missing_parameter - не найден параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Найти hint_bbox для изображений, которые возвращает FaceXServer, можно с
помощью запросов на получение аннотированного изображения.


## Контрольные списки: получение персоны
**GET** /v1/spotter/person/<person_id>

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "external_id": null,
  "first_name": "Ivan",
  "middle_name": "Ivanovich",
  "last_name": "Ivanov",
  "notes": "some note about him",
  "faces": [
    {
      "id": 10,
      "_links": {
        "source": "/v1/spotter/face/10"
      }
    },
    {
      "id": 11,
      "_links": {
        "source": "/v1/spotter/face/10"
      }
    }
  ],
  "lists": [
    {
      <контрольный список без поля persons_count
       (см. формат "Контрольные списки: получение контрольного списка")>
    },
    {
      <контрольный список без поля persons_count
       (см. формат "Контрольные списки: получение контрольного списка")>
    }
  ],
  "_links": {
    "_self": "/v1/spotter/person/42"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - персона не найдена;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: добавление изображения лица персоне
**POST** /v1/spotter/person/<person_id>?action=add_face&operator=<op_name>

Запрос копирует существующее изображение лица и ассоциирует копию с персоной.

### Пример запроса
```
POST /v1/spotter/person/42?action=add_face&operator=SampleOp
Content-Type: application/json

{
  "face_id": 10
}
```

### Пример ответа
```
201 CREATED
Location: /v1/spotter/face/42
Content-Type: application/json

{
  "id": 42,
  "_links": {
    "source": "/v1/spotter/face/42"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - персона не найдена;
* 422 no_such_face_id - изображение лица с заданным уникальным идентификатором
  не найдено;
* 422 face_indexation_disabled - для изображения лица с заданным уникальным
  идентификатором отключена индексация. Индексация может быть отключена,
  например, для изображения лица, полученного из пакетного импорта,
  которое не прошло либо Detection Filter, либо FFD Filter;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: добавление изображения лица персоне с фото
**POST** /v1/spotter/person/<person_id>?action=add_from_image&operator=<op_name>

### Пример запроса
Данный запрос может быть осуществлен в двух форматах:

```
POST /v1/spotter/person/42?action=add_from_image&operator=SampleOp
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

или

```
POST /v1/spotter/person/42?action=add_from_image&operator=SampleOp
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

В варианте с multipart/form-data поле hint_bbox обязательное. Если не указано,
то поиск лица производится на всем изображении. Если указано, то из всех
найденных лиц выбирается то, ограничивающий прямоугольник которого имеет
наибольший IOU (Intersection Over Union) c hint_bbox. При этом рассматриваются
только те лица, которые имеют IOU с hint_bbox не ниже значения, заданного в
конфигурационном поле worker_service_hint_bbox_iou_threshold.

### Пример ответа
```
201 CREATED
Location: /v1/spotter/face/42
Content-Type: application/json

{
  "id": 42,
  "_links": {
    "source": "/v1/spotter/face/42"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 not_found - персона не найдена;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 422 image_decode_error - ошибка раскодирования переданного JPEG кода;
* 422 no_faces_found - на переданном изображении не найдено лиц, либо все лица
  меньше заданного в конфигурации минимального размера для контрольных списков;
* 422 multiple_faces_found - на переданном изображении найдено несколько лиц;
* 422 face_did_not_pass_filters - на переданном изображении найдено лицо,
  но оно не прошло либо Detection Filter, либо FFD Filter;
* 422 invalid_content_type - Content-Type запроса отличается от
  multipart/form-data и image/jpeg;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

Дополнительные ошибки для multipart/form-data запроса:
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку.

### Примечания
Найти hint_bbox для изображений, которые возвращает FaceXServer, можно с
помощью запросов на получение аннотированного изображения.


## Контрольные списки: удаление изображения лица персоны
**POST** /v1/spotter/person/<person_id>?action=remove_face&operator=<op_name>

### Пример запроса
```
POST /v1/spotter/person/42?action=remove_face&operator=SampleOp
Content-Type: application/json

{
  "face_id": 10
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_operator_name - не передан query string параметр operator;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - персона не найдена;
* 422 no_such_face_id - изображение лица не найдено;
* 422 not_linked - изображение лица не связано с персоной;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: изменение персоны
**PATCH** /v1/spotter/person/<person_id>?operator=<op_name>

### Пример запроса
```
PATCH /v1/spotter/person?operator=SampleOp
Content-Type: application/json

{
  "first_name": "Ivan",
  "middle_name": "Ivanovich",
  "last_name": "Ivanov",
  "notes": "some notes about person"
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - персона не найдена;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: удаление персоны
**DELETE** /v1/spotter/person/<person_id>?operator=<op_name>

Все лица связанные с персоной удаляются. Для данных удалений отдельных записей
в истории изменений не производится.

### Пример запроса
```
DELETE /v1/spotter/person/42?operator=SampleOp
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_operator_name - не передан query string параметр operator;
* 404 not_found - персона не найдена;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Контрольные списки: получение изображения лица
**GET** /v1/spotter/face/<face_id>

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - изображение лица не найдено;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: получение аннотированного изображения лица
**GET** /v1/spotter/annotated_face/<face_id>

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - изображение лица не найдено;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

## Контрольные списки: получение списка сопоставлений
**POST** /v1/spotter/match?action=list&limit=<limit>&offset=<offset>

### Пример запроса
```
POST /v1/spotter/match?action=list&limit=2&offset=10
Content-Type: application/json

{
  "lists": [42, 34],
  "feeds": ["sample feed 0", "feed 1"],
  "persons": [67, 78],
  "min_timestamp": "2019-01-21T17:00:00+03:00",
  "max_timestamp": "2019-01-31T00:00:00+03:00",
  "mask": [null, "LOWER_FACE_MASK", "FULL_FACE_MASK"],
  "spoofing": [null, true]
}
```

Любой из параметров необязательный. При отсутствии соответствующий фильтр не
применяется.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "matches": [
    {
      <сопоставление (см. формат "Контрольные списки: получение сопоставления")>
    },
    {
      <сопоставление (см. формат "Контрольные списки: получение сопоставления")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/spotter/match?action=list&limit=2&offset=8",
    "next_link": "/v1/spotter/match?action=list&limit=2&offset=12"
  }
}
```

Результаты в ответе сортируются по убыванию времени сопоставления.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_feed_name - поток обработки не найден;
    * feed - имя потока обработки, вызвавшее ошибку;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Запрос возвращает сопоставления только из архивной БД запрашиваемого сервера.
Для получения полного списка сопоставлений необходимо запросить все работающие
сервера.

Идентификаторы сопоставлений являются уникальными только в рамках
соответствующей архивной БД.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.


## Контрольные списки: получение сопоставления
**GET** /v1/spotter/match/<match_id>

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 23,
  "list": {
    <контрольный список без поля persons_count
     (см. формат "Контрольные списки: получение контрольного списка")>
  },
  "person": {
    <персона без поля faces
     (см. формат "Контрольные списки: получение персоны")>
  },
  "detection": {
    <захват только с полями id, _links
     (см. формат "Архив: получение захвата")>
  },
  "matched_person_face_image": {
    "id": 51,
    "_links": {
      "source": "/v1/spotter/face/51"
    }
  },
  "feed": "feed 0",
  "timestamp": "2019-01-21T17:00:00Z",
  "bounding_box": {
    "x": 0.1,
    "y": 0.2,
    "w": 0.9,
    "h": 0.8
  },
  "confidence": 0.99,
  "mask": "NO_MASK",
  "is_mask_dressed_correctly_confidence": 0.313277006149292,
  "is_mask_dressed_correctly": false,
  "similarity": 0.99,
  "liveness": { <информация о liveness (см. "Liveness")> },
  "_links": {
    "_self": "/v1/spotter/match/23",
    "detection_image": "/v1/spotter/match/23/detection_image"
  }
}
```

Поле detection_image может содержать null в случае, если сопоставление было
получено более старой версией FaceXServer, где сохранение изображений не было
предусмотрено. В этом случае рекомендуется использовать изображение захвата.

Поле "list" может быть равно null в случае, если на момент выполнения запроса
контрольный список не был найден в списочной БД.

Поле "person" может быть равно null в случае, если на момент выполнения запроса
фото персоны, соответствующее сопоставлению, не было найдено в списочной БД.

Поле "mask" может быть равно null в случае, если классификация на наличие маски
не применялась.

Поля "is_mask_dressed_correctly_confidence" и "is_mask_dressed_correctly"
могут быть равны null в случае, если классификация на наличие маски
не применялась или маска не была обнаружена.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - сопоставление не найдено;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Для получения сопоставления по идентификатору следует запрашивать именно тот
сервер, который обрабатывал поток обработки и сгенерировал это сопоставление.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.

Следует отметить, что поле "detection" ведет на наилучший захват
соответствующего трэка. Наилучший захват может не соответствовать тому, который
использовался для сопоставления. Сопоставленное изображение лица можно
получить из поля "detection_image".


## Контрольные списки: получение изображения лица захвата на момент сопоставления
**GET** /v1/spotter/match/<match_id>/detection_image

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
* 404 match_not_found - сопоставление не найдено;
* 404 detection_image_not_found - изображение лица на момент сопоставления не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если сопоставление было
получено более старой версией FaceXServer, где сохранение изображений не было
предусмотрено. В этом случае рекомендуется использовать изображение из захвата,
соответствующего сопоставлению.

## Контрольные списки: получение аннотированного изображения лица захвата на момент сопоставления
**GET** /v1/spotter/match/<match_id>/annotated_detection_image

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
* 404 match_not_found - сопоставление не найдено;
* 404 detection_image_not_found - изображение лица на момент сопоставления не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если сопоставление было
получено более старой версией FaceXServer, где сохранение изображений не было
предусмотрено. В этом случае рекомендуется использовать изображение из захвата,
соответствующего сопоставлению.


## Контрольные списки: получение записи истории изменений
**GET** /v1/spotter/list_change/<list_change_id>

### Пример запроса
```
GET /v1/spotter/list_change/42
```

### Пример ответа
Типы изменений:
* list_add - создание контрольного списка;
* list_edit - редактирование контрольного списка;
* list_remove - удаление контрольного списка;
* person_add - создание персоны в контрольном списке;
* person_include - включение персоны в контрольный список;
* person_exclude - исключение персоны из контрольного списка;
* person_edit - редактирование персоны в контрольном списке;
* person_remove - исключение персоны из контрольного списка в связи с удалением;
* face_add - добавление изображения лица персоне в контрольном списке;
* face_remove - удаление изображения лица у персоны из контрольного списка.

Ниже в скобках указано, в каких из приведенных выше типов встречается поле. Если
не указано, то встречается во всех типах.

```
200 OK
Content-Type: application/json

{
  "id": 42,
  "type": "add_face",
  "operator": "some operator",
  "timestamp": "2019-01-31T00:00:00Z",
  "list": {
    <контрольный список только с полями id, _links
     (см. формат "Контрольные списки: получение контрольного списка")>
  },
  "list_name": "sample list",  (list_add, list_edit)
  "list_match_threshold": 0.99,  (list_add, list_edit)
  "list_priority": 10,  (list_add, list_edit)
  "list_notes": "list notes",  (list_add, list_edit)
  "person": {  (все типы, кроме list_*)
    <персона только с полями id, _links
     (см. формат "Контрольные списки: получение персоны")>
  },
  "person_first_name": "first_name",  (person_add, person_include, person_edit)
  "person_middle_name": "middle",  (person_add, person_include, person_edit)
  "person_last_name": null,  (person_add, person_include, person_edit)
  "person_notes": "person notes",  (person_add, person_include, person_edit)
  "person_external_id": "extid",  (person_add, person_include, person_edit)
  "face_image": {  (face_*)
     "id": 32,
     "_links": {
       "source": "/v1/spotter/face/32"
     }
  },
  "_links": {
    "_self": "/v1/list_change/42"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - запись истории изменений не найдена;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Контрольные списки: получение списка записей истории изменений
**POST** /v1/spotter/list_change?action=search?list_id=<list_id>&limit=<limit>&offset=<offset>

### Пример запроса
```
POST /v1/spotter/list_change?action=search?list_id=42&limit=2&offset=10
```

### Формат ответа
Результаты в ответе сортируются по убыванию времени изменения.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "list_changes": [
    {
      <запись истории изменений
       (см. формат "Контрольные списки: получение записи истории изменений")>
    },
    {
      <запись истории изменений
       (см. формат "Контрольные списки: получение записи истории изменений")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/spotter/list_change?action=search&list_id=42&limit=2&offset=8",
    "next_link": "/v1/spotter/list_change?action=search&list_id=42&limit=2&offset=12"
  }
}
```


### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 no_list_id - не задан query string параметр list_id;
* 422 no_such_list_id - контрольный список с заданным уникальным идентификатором не найден;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## (УСТАРЕВШЕЕ) СКУД: верификация прохода
**POST** /v1/acs?action=verify

Данный метод устарел и его поддержка может быть прекращена в будущих версиях.
Сохранен для совместимости предыдущих интеграции, использование в новых
интеграциях запрещено.

### Пример запроса
По внутреннему ID:
```
POST /v1/acs?action=verify
Content-Type: application/json

{
  "feeds": ["Feed 1", "Feed 2"],
  "card_holder_id": 30,
  "min_similarity": 0.8
}
```

По внешнему ID:
```
POST /v1/acs?action=verify
Content-Type: application/json

{
  "feeds": ["Feed 1", "Feed 2"],
  "external_id": "external_system_id",
  "min_similarity": 0.8
}
```

Если запрос содержит оба поля card_holder_id и external_id, то это будет
запрос по внешнему ID и поле card_holder_id будет проигнорировано.

Поле min_similarity является опциональным. Если поля нет, то порог берется
из конфигурационного поля acs_similarity_threshold потока обработки.

### Пример ответа
Если видели человека:
```
200 OK
Content-Type: application/json

{
  "acs_verification": {
    "feed": "Feed 1"
    "similarity": 0.87,
    "liveness": { <информация о liveness (см. "Liveness")> },
    "acs_record": {
      "id": 325,
      "timestamp": "2019-01-21T17:00:00+03:00",
      "bounding_box": {
        "x": 0.1,
        "y": 0.2,
        "w": 0.9,
        "h": 0.8
      }
    },
    "detection": {
      <захват только с полями id, _links
       (см. формат "Архив: получение захвата)>
    }
  }
}
```

Если не видели человека:
```
200 OK
Content-Type: application/json

{
  "acs_verification": null
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_feed_name - поток обработки не найден;
    * feed - имя потока обработки, вызвавшее ошибку;
* 409 feed_has_acs_disabled - СКУД режим выключен для потока обратки;
    * feed - имя потока обработки, вызвавшее ошибку;
* 422 card_holder_not_found - держатель карты не найден;
* 422 card_holder_has_no_linked_image - изображение лица не привязано к
  держателю карты;
* 422 card_holder_image_not_indexed - изображение лица держателя карты не
  проиндексировано;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Запрос должен быть отправлен на сервер, непосредственно обрабатывающий поток
обработки.

Поле захвата "detection" может быть null, в случае если для трэка не
производилась запись лица а архив.

Следует отметить, что поле "detection" ведет на наилучший захват
соответствующего трэка. Наилучший захват может не соответствовать тому, который
использовался для верификации. Информация о liveness для наилучшего захвата
может быть не актуальной, поэтому следует пользоваться таковой из основных полей
ответа.

Из всех подходящих по порогу совпадений с буферами СКУД заданных потоков
обработки выдается самое уверенное.


## (УСТАРЕВШЕЕ) СКУД: получение изображения захвата в буфере ACS
**POST** /v1/acs?action=get_record_face

Данный метод устарел и его поддержка может быть прекращена в будущих версиях.
Сохранен для совместимости предыдущих интеграции, использование в новых
интеграциях запрещено.

### Пример запроса
```
POST /v1/acs?action=get_record_face
Content-Type: application/json

{
  "feed": "sample feed",
  "record_id": 42
}
```

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 404 acs_verification_not_found - запись верификации прохода не найдена;
* 404 detection_image_not_found - изображение лица на момент верификации не
  найдено.

### Примечания
Данный запрос следует направлять именно к тому серверу, который обслуживает
данный поток обработки. Нумерация record_id независимая между серверами.
Обращение к другому серверу может привести к получению несоответствующего
изображения.

Ошибка detection_image_not_found возможна в случае, если запись верификации
прохода была сделана более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение из захвата, соответствующего записи.


## СКУД: создание держателя карты
**POST** /v1/acs/card_holder?action=create

### Пример запроса
```
POST /v1/acs/card_holder?action=create
Content-Type: application/json

{
  "external_id": "external_system_id",
  "first_name": "ivan",
  "middle_name": null,
  "last_name": "Ivanov",
  "notes": "some notes"
}
```

Любое из полей external_id, first_name, middle_name, last_name, notes может быть
пропущено.

### Пример ответа
```
201 CREATED
Location: /v1/acs/card_holder/42
Content-Type: application/json

{
  <держатель карты тольско с полями id, _links
   (см. формат "СКУД: получение держателя карты")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 duplicate_external_id - держатель карты с переданным external_id уже
  существует;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

### Примечания
Если при создании держателя карты не передан external_id или передан null, то
использовать функции, обращающиеся к нему по внешнему ID, будет невозможно.

Создание нескольких персон с external_id равным null не приводит к ошибке
duplicate_external_id.


## СКУД: получение держателя карты
По внутреннему ID: **GET** /v1/acs/card_holder/<card_holder_id>

По внешнему ID: **POST** /v1/acs/card_holder?action=get

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=get
Content-Type: application/json

{
  "external_id": "external_system_id"
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "external_id": "external_system_id",
  "first_name": "ivan",
  "middle_name": null,
  "last_name": "Ivanov",
  "notes": "some notes",
  "face_image": {
    "id": 56,
    "_links": {
      "source": "/v1/spotter/face/56"
    }
  },
  "_links": {
    "_self": "/v1/acs/card_holder/42"
  }
}
```

face_image может быть null, если фото держателя карты не установлено.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

Дополнительные ошибки для запроса по внутреннему ID:
* 404 not_found - держатель карты не найден.

Дополнительные ошибки для запроса по внешнему ID:
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - держатель карты не найден.


## СКУД: изменение держателя карты
По внутреннему ID: **PATCH** /v1/acs/card_holder/<card_holder_id>

По внешнему ID: **POST** /v1/acs/card_holder?action=patch

### Пример запроса
По внутреннему ID:
```
PATCH /v1/acs/card_holder/42
Content-Type: application/json

{
  "new_external_id": "foobarid",
  "first_name": "new first_name",
  "middle_name": "new middle name",
  "last_name": null,
  "notes": null
}
```

По внешнему ID:
```
POST /v1/acs/card_holder?action=delete
Content-Type: application/json

{
  "external_id": "external_system_id",
  "new_external_id": "foobarid",
  "first_name": "new first_name",
  "middle_name": "new middle name",
  "last_name": null,
  "notes": null
}
```

ВАЖНО: поле external_id используется для адресации по внешнему ID, а поле
new_external_id используется для изменения данных.

Любое из полей: new_external_id, first_name, middle_name, last_name, notes может
быть пропущено.

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

Дополнительные ошибки для запроса по внутреннему ID:
* 404 not_found - держатель карты не найден.

Дополнительные ошибки для запроса по внешнему ID:
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 not_found - держатель карты не найден.


## СКУД: удаление держателя карты
По внутреннему ID: **DELETE** /v1/acs/card_holder/<card_holder_id>

По внешнему ID: **POST** /v1/acs/card_holder?action=delete

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=delete
Content-Type: application/json

{
  "external_id": "external_system_id"
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

Дополнительные ошибки для запроса по внутреннему ID:
* 404 not_found - держатель карты не найден.

Дополнительные ошибки для запроса по внешнему ID:
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - держатель карты не найден.


## СКУД: получение фото держателя карты
По внутреннему ID: **GET** /v1/acs/card_holder/<card_holder_id>/face

По внешнему ID: **POST** /v1/acs/card_holder?action=get_face

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=get_face
Content-Type: application/json

{
  "external_id": "external_system_id"
}
```

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
Данный запрос в случае ошибки возвращает не JSON, а пустое тело с указанными
ниже кодами:
* 409 - функционал списочной БД выключен;
* 404 - держатель карты не найден или с ним не связано фото;
* 503 - все реплики списочной БД недоступны.

Дополнительные ошибки для запроса по внешнему ID (**приходят в JSON**):
* 409 lists_functionality_disabled - функционал списочной БД выключен.
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - держатель карты не найден;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## СКУД: получение аннотированного фото держателя карты
По внутреннему ID: **GET** /v1/acs/card_holder/<card_holder_id>/annotated_face

По внешнему ID: **POST** /v1/acs/card_holder?action=get_annotated_face

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=get_annotated_face
Content-Type: application/json

{
  "external_id": "external_system_id"
}
```

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
Данный запрос в случае ошибки возвращает не JSON, а пустое тело с указанными
ниже кодами:
* 409 - функционал списочной БД выключен;
* 404 - держатель карты не найден или с ним не связано фото;
* 503 - все реплики списочной БД недоступны.

Дополнительные ошибки для запроса по внешнему ID (**приходят в JSON**):
* 409 lists_functionality_disabled - функционал списочной БД выключен.
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - держатель карты не найден;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## СКУД: добавление/обновление фото держателя карты
По внутреннему ID: **PUT** /v1/acs/card_holder/<card_holder_id>/face

По внешнему ID: **POST** /v1/acs/card_holder?action=put_face

### Пример запроса по внутреннему ID
Запрос по внутреннему ID может быть осуществлен в двух форматах:

```
PUT /v1/acs/card_holder/42/face
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

или

```
PUT /v1/acs/card_holder/42/face
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

В варианте с multipart/form-data поле hint_bbox обязательное.
Описание этого поля приведено ниже для запроса по внешнему ID.

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=put_face
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "external_id": "external_system_id",
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

Поле hint_bbox опциональное. Если не указано, то поиск лица производится на
всем изображении. Если указано, то из всех найденных лиц выбирается то,
ограничивающий прямоугольник которого имеет наибольший IOU (Intersection Over
Union) c hint_bbox. При этом рассматриваются только те лица, которые имеют IOU
с hint_bbox не ниже значения, заданного в конфигурационном поле
worker_service_hint_bbox_iou_threshold.

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - держатель карты не найден;
* 503 service_overload - сервис перегружен (переполнена очередь заданий);
* 422 image_decode_error - ошибка раскодирования переданного JPEG кода;
* 422 no_faces_found - на переданном изображении не найдено лиц, либо все
  лица меньше заданного в конфигурации ограничения по размеру для СКУД;
* 422 multiple_faces_found - на переданном изображении найдено несколько лиц;
* 422 face_did_not_pass_filters - на переданном изображении найдено лицо,
  но оно не прошло либо Detection Filter, либо FFD Filter;
* 422 invalid_content_type - Content-Type запроса отличается от
  multipart/form-data и image/jpeg;
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

Дополнительные ошибки для запроса по внешнему ID:
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action.

### Примечания
Найти hint_bbox для изображений, которые возвращает FaceXServer, можно с
помощью запросов на получение аннотированного изображения.


## СКУД: удаление фото держателя карты
По внутреннему ID: **DELETE** /v1/acs/card_holder/<card_holder_id>/face

По внешнему ID: **POST** /v1/acs/card_holder?action=delete_face

### Пример запроса по внешнему ID
```
POST /v1/acs/card_holder?action=delete_face
Content-Type: application/json

{
  "external_id": "external_system_id"
}
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_such_card_holder_id - держатель карты не найден;
* 404 no_linked_face - изображение лица держателя карты не найдено;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

Дополнительные ошибки для запроса по внешнему ID:
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 not_found - держатель карты не найден.


## СКУД: получение списка держателей карт
**GET** /v1/acs/card_holder?limit=<limit>&offset=<offset>&search=<query>&order_by=<order_by>

### Пример запроса
```
GET /v1/acs/card_holder?limit=2&offset=10&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc
```

Параметр запроса search опциональный. Если он задан, то для выданных персон
верно следующее: каждое слово из параметра входит как подстрока в одно из полей
персоны: first_name, middle_name, last_name, external_id. Поиск подстроки
регистронезависимый. Слова в параметре разделяются пробелом.

Параметр запроса order_by опциональный. Он задает сортировку выдаваемого списка.
Может принимать одно из значений: <field>_asc, <field>_desc, где field это одно
из: id, external_id, first_name, middle_name, last_name. <field>_asс сортирует
по полю <field> по возрастанию, <field>_desc по убыванию. Если параметр не
задан, то список сортируется по возрастанию id.

### Пример ответа
```
200 OK
Content-type: application/json

{
  "card_holders": [
    {
      <держатель карты (см. формат "СКУД: получение держателя карты")>
    },
    {
      <держатель карты (см. формат "СКУД: получение держателя карты")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/acs/card_holder?limit=2&offset=8&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc",
    "next_link": "/v1/acs/card_holder?limit=2&offset=12&search=ivan+%D0%B8%D0%B2%D0%B0%D0%BD&order_by=id_desc"
  }
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_such_order_by - передан недопустимый параметр order_by;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## СКУД: поиск держателей карт по фото
**POST** /v1/acs/card_holder?action=search_by_image

### Пример запроса
```
POST /v1/acs/card_holder?action=search_by_image
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "min_similarity": 0.8,
  "hint_bbox": {"x": 153, "y": 140, "w": 224, "h": 312}
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

Поле hint_bbox опциональное. Если не указано, то поиск лица производится на
всем изображении. Если указано, то из всех найденных лиц выбирается то,
ограничивающий прямоугольник которого имеет наибольший IOU (Intersection Over
Union) c hint_bbox. При этом рассматриваются только те лица, которые имеют IOU
с hint_bbox не ниже значения, заданного в конфигурационном поле
worker_service_hint_bbox_iou_threshold.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "availability": {
    "number_of_not_indexed_records": 25
  },
  "matches": [
    {
      "card_holder": {
        <держатель карты (см. формат "СКУД: получение держателя карты")>
      },
      "similarity": 0.9
    },
    {
      "card_holder": {
        <держатель карты (см. формат "СКУД: получение держателя карты")>
      },
      "similarity": 0.99
    }
  ]
}
```

number_of_not_indexed_records - число лиц держателей карт, для которых нет
построенного дескриптора актуальной версии.

### Ошибки
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 422 image_decode_error - ошибка раскодирования переданного JPEG кода;
* 422 multiple_faces_found - на переданном изображении найдено несколько лиц;
* 422 no_faces_found - на переданном изображении не найдено лиц;
* 422 face_did_not_pass_filters - на переданном изображении найдено лицо,
  но оно не прошло либо Detection Filter, либо FFD Filter;
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 invalid_json - часть, содержащая JSON, содержит некорректный JSON;
* 422 missing_parameter - не найден параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_parameter - некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Найти hint_bbox для изображений, которые возвращает FaceXServer, можно с
помощью запросов на получение аннотированного изображения.


## СКУД: очистка списка держателей карт
**DELETE** /v1/acs/card_holder

### Пример ответа
```
200 OK
Content-type: application/json

{
  "card_holders_deleted_count": 42
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## СКУД: верификация прохода
**POST** /v1/acs/verification?action=create

### Пример запроса
По внутреннему ID:
```
POST /v1/acs/verification?action=create
Content-Type: application/json

{
  "feeds": ["Feed 1", "Feed 2"],
  "card_holder_id": 30,
  "min_similarity": 0.8
}
```

По внешнему ID:
```
POST /v1/acs/verification?action=create
Content-Type: application/json

{
  "feeds": ["Feed 1", "Feed 2"],
  "external_id": "external_system_id",
  "min_similarity": 0.8
}
```

Если запрос содержит оба поля card_holder_id и external_id, то это будет
запрос по внешнему ID и поле card_holder_id будет проигнорировано.

Поле min_similarity является опциональным. Если поля нет, то порог берется
из конфигурационного поля acs_similarity_threshold потока обработки.

### Пример ответа
```
201 CREATED
Location: /v1/acs/verification/42
Content-Type: application/json

{
  <запись верификации прохода с гарантией, что поле card_holder не равно null
   (см. формат "СКУД: получение записи верификации прохода")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_feed_name - поток обработки не найден;
    * feed - имя потока обработки, вызвавшее ошибку;
* 409 feed_has_acs_disabled - СКУД режим выключен для потока обратки;
    * feed - имя потока обработки, вызвавшее ошибку;
* 422 card_holder_not_found - держатель карты не найден;
* 422 card_holder_has_no_linked_image - изображение лица не привязано к
  держателю карты;
* 422 card_holder_image_not_indexed - изображение лица держателя карты не
  проиндексировано;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Запрос должен быть отправлен на сервер, непосредственно обрабатывающий поток
обработки.

Из всех подходящих по порогу совпадений с буферами СКУД заданных потоков
обработки выдается самое уверенное.


## СКУД: получение записи верификации прохода
**GET** /v1/acs/verification/<verification_id>

### Пример запроса
```
GET /v1/acs/verification/42
```

### Пример ответа
Если видели человека:
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "request": {
    "timestamp": "2019-01-21T17:00:05+03:00"
    "feeds": ["Feed 1", "Feed 2"]
    "card_holder": {
      <держатель карты (см. формат "СКУД: получение держателя карты")>
    },
    "min_similarity": 0.87
  },
  "result": {
    "feed": "Feed 1"
    "detection": {
       <захват только с полями id, _links
        (см. формат "Архив: получение захвата)>
    },
    "timestamp": "2019-01-21T17:00:00+03:00",
    "bounding_box": {
      "x": 0.1,
      "y": 0.2,
      "w": 0.9,
      "h": 0.8
    },
    "confidence": 0.99,
    "mask": "NO_MASK",
    "is_mask_dressed_correctly_confidence": null,
    "is_mask_dressed_correctly": null,
    "similarity": 0.87,
    "liveness": { <информация о liveness (см. "Liveness")> },
  },
  "_links": {
    "_self": "/v1/acs/verification/42",
    "detection_image": "/v1/acs/verification/42/detection_image"
  }
}
```

Если не видели человека:
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "request": {
    "timestamp": "2019-01-21T17:00:05+03:00"
    "feeds": ["Feed 1", "Feed 2"]
    "card_holder": {
      <держатель карты только с полями id, _links
       (см. формат "СКУД: получение держателя карты")>
    },
    "min_similarity": 0.9
  },
  "result": null,
  "_links": {
    "_self": "/v1/acs/verification/42"
  }
}
```

Поле "min_similarity" отражает порог реально примененный при сопоставлении лиц,
т.е. если параметр не передавался явно в запрос на верификацию, то поле будет
равно соответствующему значению по-умолчанию (см. "СКУД: верификация прохода").

Поле захвата "detection" может быть null, в случае если для трэка не
производилась запись лица в архив на момент верификации.

Поле detection_image может содержать null в случае, если верификация была
записана более старой версией FaceXServer, где сохранение изображений не было
предусмотрено. В этом случае рекомендуется использовать изображение захвата.

Поле "card_holder" может быть равно null в случае, если на момент выполнения
запроса держатель карты был удален из списочной БД.

Поле "mask" может быть равно null в случае, если классификация на наличие маски
не применялась.

Поля "is_mask_dressed_correctly_confidence" и "is_mask_dressed_correctly"
могут быть равны null в случае, если классификация на наличие маски
не применялась или маска не была обнаружена.

### Ошибка
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - запись верификации с заданным уникальным идентификатором не
  найдена.

### Примечания
Для получения записи верификации прохода по идентификатору следует запрашивать
именно тот сервер, который обрабатывал поток обработки и сгенерировал эту
запись.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.

Следует отметить, что поле "detection" ведет на наилучший захват
соответствующего трэка. Наилучший захват может не соответствовать тому, который
использовался для верификации. Сопоставленное изображение лица можно
получить из поля "detection_image".

Информация о liveness для наилучшего захвата может быть не актуальной, поэтому
следует пользоваться таковой из основных полей ответа.


## СКУД: получение списка записей запросов верификаций прохода
**POST** /v1/acs/verification?action=list&limit=<limit>&offset=<offset>

### Пример запроса
```
POST /v1/acs/verification?action=list&limit=2&offset=10
Content-Type: application/json

{
  "card_holders": [42, 34],
  "card_holder_external_ids": ["external id 1", "external id 2"],
  "request_min_timestamp": "2019-01-21T17:00:00+03:00",
  "request_max_timestamp": "2019-01-31T00:00:00+03:00",
  "has_result": true,
  "mask": [null, "LOWER_FACE_MASK", "FULL_FACE_MASK"],
  "spoofing": [null, true]
}
```

Правила фильтрации записей запросов верификации:
* card_holders - держатель карты из запроса имеет один из указанных уникальных
  идентификаторов;
* card_holder_external_ids - держатель карты из запроса имеет один из указанных
  внешних уникальных идентификаторов;
* request_min_timestamp - время запроса не меньше данного;
* request_max_timestamp - время запроса не больше данного;
* has_result - true: показать записи, только если человек нашелся, false:
  показать записи, только если человек не нашелся.
* mask - наличие маски на лице. Принимает следующие значения:
    * null - в случае если классификация на наличие маски не применялась;
    * "NO_MASK" - нет маски;
    * "LOWER_FACE_MASK" - медицинская маска или подобные;
    * "FULL_FACE_MASK" - лыжная маска, балаклава или подобные;
    * "OTHER_MASK" - другие типы масок;
* spoofing - имеется ли факт подмены лица, то есть значение liveness ниже
  установленного для потока обработки порога. Принимает следующие значения:
    * null - если для кадров трэка не производилось вычисление liveness;
    * true - обнаружена подмена
    * false - подмена не обнаружена

Любой из параметров необязательный. При отсутствии соответствующий фильтр не
применяется.

При одновременном использовании фильтров card_holders и card_holder_external_ids
в выдачу попадают запросы, подходящие под один из них.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "acs_verifications": [
    {
       <запись верификации прохода
        (см. формат "СКУД: получение записи верификации прохода")>
    },
    {
       <запись верификации прохода
        (см. формат "СКУД: получение записи верификации прохода")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/acs/verification?action=list&limit=2&offset=8",
    "next_link": "/v1/acs/verification?action=list&limit=2&offset=12"
  }
}
```

Результаты в ответе сортируются по убыванию времени запроса верификации.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
Запрос возвращает записи верификаций проходов только из архивной БД
запрашиваемого сервера. Для получения полного списка записей необходимо
запросить все работающие сервера.

Идентификаторы записей верификаций проходов являются уникальными только в рамках
соответствующей архивной БД.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.


## СКУД: получение изображения лица захвата на момент верификации
**GET** /v1/acs/verification/<verification_id>/detection_image

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
* 404 acs_verification_not_found - запись верификации прохода не найдена;
* 404 detection_image_not_found - изображение лица на момент верификации не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если запись верификации
прохода была сделана более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение из захвата, соответствующего записи.


## СКУД: получение аннотированного изображения лица захвата на момент верификации
**GET** /v1/acs/verification/<verification_id>/annotated_detection_image

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
* 404 acs_verification_not_found - запись верификации прохода не найдена;
* 404 detection_image_not_found - изображение лица на момент верификации не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если запись верификации
прохода была сделана более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение из захвата, соответствующего записи.


## СКУД: получение сопоставления со списком СКУД
**GET** /v1/acs/match/<match_id>

### Пример запроса
`GET /v1/acs/match/42`

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "feed": "Feed 1",
  "card_holder": {
    <держатель карты (см. формат "СКУД: получение держателя карты")>
  },
  "detection": {
    <захват только с полями id, _links
     (см. формат "Архив: получение захвата")>
  },
  "timestamp": "2019-01-21T17:00:00+03:00",
  "bounding_box": {
    "x": 0.1,
    "y": 0.2,
    "w": 0.9,
    "h": 0.8
  },
  "confidence": 0.99,
  "mask": "NO_MASK",
  "is_mask_dressed_correctly_confidence": null,
  "is_mask_dressed_correctly": null,
  "similarity": 0.99,
  "liveness": { <информация о liveness (см. "Liveness")> },
  "_links": {
    "_self": "/v1/acs/match/42",
    "detection_image": "/v1/acs/match/42/detection_image"
  }
}
```

Поле "detection" может быть null, если для трэка не производилась запись лучшего
лица в БД в момент сопоставления.

Поле detection_image может содержать null в случае, если сопоставление со
списком СКУД было получено более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение захвата.

Поле "card_holder" может быть равно null в случае, если на момент выполнения
запроса держатель карты не был найден в списочной БД.

Поле "mask" может быть равно null в случае, если классификация на наличие маски
не применялась.

Поля "is_mask_dressed_correctly_confidence" и "is_mask_dressed_correctly"
могут быть равны null в случае, если классификация на наличие маски
не применялась или маска не была обнаружена.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - изображение лица не найдено;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечание
Для получения сопоставления со списком СКУД по идентификатору следует
запрашивать именно тот сервер, который обрабатывал поток обработки и
сгенерировал это сопоставление.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.

Следует отметить, что поле "detection" ведет на наилучший захват
соответствующего трэка. Наилучший захват может не соответствовать тому, который
использовался для сопоставления. Сопоставленное изображение лица можно
получить из поля "detection_image".

Информация о liveness для наилучшего захвата может быть не актуальной, поэтому
следует пользоваться таковой из основных полей ответа.


## СКУД: получение списка сопоставлений со списком СКУД
**POST** /v1/acs/match?action=list&limit=<limit>&offset=<offset>

### Пример запроса
```
POST /v1/acs/match?action=list&limit=2&offset=10
Content-Type: application/json

{
  "feeds": ["sample feed 0", "feed 1"],
  "card_holders": [42, 34],
  "card_holder_external_ids": ["external id 1", "external id 2"],
  "min_timestamp": "2019-01-21T17:00:00+03:00",
  "max_timestamp": "2019-01-31T00:00:00+03:00",
  "mask": [null, "LOWER_FACE_MASK", "FULL_FACE_MASK"],
  "spoofing": [null, true]
}
```

Правила фильтрации:
* feeds - сопоставление произошло в одном из указанных потоков обработки;
* card_holders - держатель карты имеет один из указанных уникальных
  идентификаторов;
* card_holder_external_ids - держатель карты имеет один из указанных внешних
  уникальных идентификаторов;
* min_timestamp - время сопоставления не меньше указанного;
* timestamp - время сопоставления не больше указанного.
* mask - наличие маски на лице. Принимает следующие значения:
    * null - в случае если классификация на наличие маски не применялась;
    * "NO_MASK" - нет маски;
    * "LOWER_FACE_MASK" - медицинская маска или подобные;
    * "FULL_FACE_MASK" - лыжная маска, балаклава или подобные;
    * "OTHER_MASK" - другие типы масок;
* spoofing - имеется ли факт подмены лица, то есть значение liveness ниже
  установленного для потока обработки порога. Принимает следующие значения:
    * null - если для кадров трэка не производилось вычисление liveness;
    * true - обнаружена подмена
    * false - подмена не обнаружена

Любой из параметров необязательный. При отсутствии соответствующий фильтр не
применяется.

При одновременном использовании фильтров card_holders и card_holder_external_ids
в выдачу попадают запросы, подходящие под один из них.

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "acs_matches": [
    {
      <сопоставление со списком СКУД
       (см. формат "СКУД: получение сопоставления со списком СКУД")>
    },
    {
      <сопоставление со списком СКУД
       (см. формат "СКУД: получение сопоставления со списком СКУД")>
    }
  ],
  "_pagination": {
    "total_records": 100,
    "prev_link": "/v1/acs/match?action=list&limit=2&offset=8",
    "next_link": "/v1/acs/match?action=list&limit=2&offset=12"
  }
}
```

Результаты в ответе сортируются по убыванию времени сопоставления со списком СКУД.

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 invalid_feed_name - поток обработки не найден;
    * feed - имя потока обработки, вызвавшее ошибку.

### Примечания
Запрос возвращает сопоставления со списокм СКУД только из архивной БД
запрашиваемого сервера. Для получения полного списка сопоставлений необходимо
запросить все работающие сервера.

Идентификаторы сопоставлений со списком СКУД являются уникальными только в
рамках соответствующей архивной БД.

Следует отметить, что поток обработки в различные моменты времени потенциально
может обрабатываться различными серверами.


## СКУД: получение изображения лица захвата в момент сопоставления со списком СКУД
**GET** /v1/acs/match/<match_id>/detection_image

### Пример ответа
```
200 OK
Content-Type: image/jpeg

<binary-image-jpeg-code>
```

### Ошибки
* 404 acs_match_not_found - сопоставление со списком СКУД не найдено;
* 404 detection_image_not_found - изображение лица в момент сопоставления не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если сопоставление со
списком СКУД было получено более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение из захвата, соответствующего сопоставлению со списком СКУД.


## СКУД: получение аннотированного изображения лица захвата в момент сопоставления со списком СКУД
**GET** /v1/acs/match/<match_id>/annotated_detection_image

### Формат ответа
Содержимое ответа имеет тип multipart/form-data и 2 части:
* закодированное в JPEG изображение;
* JSON со следующими полями:
  * bbox_on_image (object) - местоположение ограничивающего лицо
    прямоугольника на изображении выше:
      * x (integer) - X координата левого верхнего угла;
      * y (integer) - Y координата левого верхнего угла;
      * w (integer) - ширина;
      * h (integer) - высота;

### Пример ответа
```
200 OK
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Type: image/jpeg
Content-Disposition: form-data; name="image"

<binary-image-jpeg-code>
--ABCD
Content-Type: application/json
Content-Disposition: form-data; name="data"

{"bbox_on_image":{"x":1,"y":2,"w":3,"h":4}}
--ABCD--
```

### Ошибки
* 404 acs_match_not_found - сопоставление со списком СКУД не найдено;
* 404 detection_image_not_found - изображение лица в момент сопоставления не
  найдено.

### Примечание
Ошибка detection_image_not_found возможна в случае, если сопоставление со
списком СКУД было получено более старой версией FaceXServer, где сохранение
изображений не было предусмотрено. В этом случае рекомендуется использовать
изображение из захвата, соответствующего сопоставлению со списком СКУД.


## Пакетный импорт: создание сессии
**POST** /v1/spotter/import/session

### Пример запроса
```
POST /v1/spotter/import/session
```

### Пример ответа
```
201 Created
Location: /v1/spotter/import/session/42
Content-Type: application/json

{
  <сессия только с полями id, _links
   (см. формат "Пакетный импорт: получение сессии")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Пакетный импорт: получение сессии
**GET** /v1/spotter/import/session/<import_session_id>

### Пример запроса
```
GET /v1/spotter/import/session/42
```

### Пример ответа
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "state": "receiving_images",
  "items": [
    {
      <запись пакетного импорта
       (см. формат "Пакетный импорт: получение записи пакетного импорта")>
    },
    {
      <запись пакетного импорта
       (см. формат "Пакетный импорт: получение записи пакетного импорта")>
    },
    {
      <запись пакетного импорта
       (см. формат "Пакетный импорт: получение записи пакетного импорта")>
    }
  ],
  "_links": {
    "_self": "/v1/spotter/import/session/42"
  }
}
```

session_state is one of: receiving_images, queued, processing, completed

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - сессия не найдена;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.


## Пакетный импорт: добавление изображения в сессию
**POST** /v1/spotter/import/session/<import_session_id>?action=add_image
### Пример запроса
```
POST /v1/spotter/import/session/42?action=add_image
Content-Type: multipart/form-data; boundary=ABCD

--ABCD
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "source": "some_image.jpg",
  "first_name": "Foo",
  "middle_name": "Bar",
  "last_name": "Baz"
}
--ABCD
Content-Disposition: form-data; name="image"
Content-Type: image/jpeg

<binary-image-jpeg-code>
--ABCD--
```

### Пример ответа
```
201 CREATED
Location: /v1/spotter/import/item/100
Content-Type: application/json

{
  <запись пакетного импорта только с полями id, _links
   (см. формат "Пакетный импорт: получение записи пакетного импорта")>
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 422 no_action_provided - не задан query string параметр action;
* 422 no_such_action - передан некорректный query string параметр action;
* 422 invalid_multipart_form_data_content_type - запрос содержит
  неподдерживаемый Content-Type;
* 422 failed_to_parse_multipart_form_data - некорректный формат запроса;
* 422 application_json_part_not_found - часть, содержащая JSON, не найдена;
* 422 multiple_application_json_parts_found - несколько частей содержат JSON;
* 422 invalid_json - передан некорректный JSON;
* 422 invalid_parameter - передан некорректный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 missing_parameter - пропущен обязательный параметр запроса:
    * parameter - имя параметра, вызвавшего ошибку;
* 422 image_jpeg_part_not_found - часть содержащая JPEG изображение не найдена;
* 422 multiple_image_jpeg_parts_found - несколько частей содержат JPEG
  изображение;
* 404 not_found - сессия не найдена;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.

### Примечания
All names are optional and could be omitted.


## Пакетный импорт: запуск обработки сессии
**POST** /v1/spotter/import/session/<import_session_id>?action=process

### Пример запроса
```
POST /v1/spotter/import/session/42?action=process
```

### Пример ответа
```
202 ACCEPTED
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - сессия не найдена;
* 422 already_processed_or_queued - обработка сессии уже запущена;
* 503 service_overload - сервис перегружен (переполнена очередь задач);
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Пакетный импорт: удаление сессии
**DELETE** /v1/spotter/import/session/<import_session_id>

### Пример запроса
```
DELETE /v1/spotter/import/session/42
```

### Пример ответа
```
200 OK
Content-Type: application/json

{}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - сессия не найдена;
* 503 primary_lists_database_is_unreachable - главная реплика списочной БД
  недоступна.


## Пакетный импорт: получение записи пакетного импорта
**GET** /v1/spotter/import/item/<import_item_id>

### Пример запроса
```
GET /v1/spotter/import/item/42
```

### Пример ответа
Faces found
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "state": "ok",
  "source": "some_image.jpg",
  "first_name": "Foo",
  "middle_name": null,
  "last_name": "Baz",
  "name_matches": [
    {
      <персона без полей faces, lists
       (см. формат "Контрольные списки: получение персоны")>
    },
    {
      <персона без полей faces, lists
       (см. формат "Контрольные списки: получение персоны")>
    }
  ],
  "faces": [
    {
      "face_image": {
        "id": 76,
        "_links": {
          "source": "/v1/spotter/face/76"
        }
      },
      "cluster_tag": 2,
      "confidence": 0.78,
      "passed_filters": true,
      "face_matches": [
        {
          "similarity": 0.98
          "person": {
            <персона без полей faces, lists
             (см. формат "Контрольные списки: получение персоны")>
          },
          "matched_person_face_image": {
            "id": 87,
            "_links": {
              "source": "/v1/spotter/face/87"
            }
          }
        }
      ]
    },
    {
      "face_image": {
        "id": 77,
        "_links": {
          "source": "/v1/spotter/face/77"
        }
      },
      "cluster_tag": -1,
      "confidence": 0.77,
      "passed_filters": false,
      "face_matches": []
    }
  ],
  "_links": {
    "_self": "/v1/spotter/import/item/42"
  }
}
```

Failed to decode image
```
200 OK
Content-Type: application/json

{
  "id": 42,
  "state": "invalid_image",
  "source": "some_image.jpg",
  "first_name": "Foo",
  "middle_name": null,
  "last_name": "Baz"
  "name_matches": [
    {
      <персона без полей faces, lists
       (см. формат "Контрольные списки: получение персоны")>
    },
    {
      <персона без полей faces, lists
       (см. формат "Контрольные списки: получение персоны")>
    }
  ]
}
```

### Ошибки
* 409 lists_functionality_disabled - функционал списочной БД выключен;
* 404 not_found - запись пакетного импорта не найдена;
* 503 lists_databases_are_unreachable - все реплики списочной БД недоступны.

### Примечания
При обработке изображений пакетного импорта применяются ограничения на размер
лиц для контрольных списков. Поэтому отсутствие лиц в поле "faces"
означает, что лиц не найдено, либо все найденные лица не подходят по
ограничению.

К каждому найденному лицу применяются Detection и FFD фильтры, а результат
их прохождения записывается в поле passed_filters. Для лиц, которые не прошли
хотя бы один из фильтров, cluster_tag всегда будет равен -1, а face_matches
всегда будет пустым списком.


## Потоки событий
Для получения потоков событий необходимо подключиться к API по URL /v1/events
c помощью WebSocket.

### Подписка
#### Формат запроса
Запрос содержит JSON объект:
* plane (string) - задает поток событий:
    - detections - для захватов;
    - matches - для сопоставлений;
    - acs_verifications - для запросов к СКУД;
    - acs_matches - для сопоставлений со списком СКУД;
    - no_match - для захватов, не совпавших с контрольными списками и списком СКУД;
* action (string) - subscribe;
* feeds (list of string) - список потоков обработки.

#### Пример запроса
```
{
  "plane": "detections",
  "action": "subscribe",
  "feeds": ["feed 0", "feed 1"]
}
```

#### Пример ответа
```
{
  "status": "ok",
  "plane": "detections",
  "action": "subscribe",
  "feeds": [
    {"name": "feed 0", "status": "ok"},
    {"name": "feed 1", "status": "error", "error": "invalid_feed_name"}
  ]
}
```

#### Ошибки
* invalid_json
* missing_parameter (parameter)
* invalid_parameter (parameter)
* no_such_plane
* no_such_action
* internal_server_error

##### Ошибки для каждого feed в запросе
* invalid_feed_name
* already_subscribed

### Отписка
#### Формат запроса
Запрос содержит JSON объект:
* plane (string) - см. формат данного поля для подписки;
* action (string) - unsubscribe;
* feeds (list of string) - список потоков обработки.

#### Пример запроса
```
{
  "plane": "matches",
  "action": "unsubscribe",
  "feeds": ["feed 0", "feed 1"]
}
```

#### Пример ответа
```
{
  "status": "ok",
  "plane": "matches",
  "action": "subscribe",
  "feeds": [
    {"name": "feed 0", "status": "ok"},
    {"name": "feed 1", "status": "error", "error": "invalid_feed_name"}
  ]
}
```

#### Ошибки
* invalid_json
* missing_parameter (parameter)
* invalid_parameter (parameter)
* lists_functionality_disabled (only for spotter plane)
* no_such_plane
* no_such_action
* internal_server_error

Пример:
```
{"status": "error", "error": "invalid_json"}
```

##### Ошибки для каждого feed в запросе
* invalid_feed_name
* already_unsubscribed

Пример см. в примере ответа выше.


### Событие захвата
#### Пример
```
{
  "plane": "detections",
  "detection": {
    <захват (см. формат "Архив: получение захвата")>
  }
}
```

### Событие сопоставления
#### Пример
```
{
  "plane": "matches",
  "match": {
    <сопоставление с подробной информацией о захвате и гарантией, что поля
     list и person не равны null (см. формат "Контрольные списки: получение
     сопоставления", "Архив: получение захвата")>
  }
}
```

### Событие запроса СКУД
#### Пример
```
{
  "plane": "acs_verifications",
  "feed": "Feed 1",
  "acs_verification": {
    <запись верификации прохода с гарантией, что поле card_holder не равно null
     (см. формат "СКУД: получение записи верификации прохода")>
  }
}
```

#### Примечание
Данное событие поступит ко всем слушателям, подписанным на потоки обработки из
запроса СКУД. В зависимости от логики обработки события следует проверять
совпадение поля feed в поле result c полем feed в самом событии. Далее приведены
примеры возможных комбинаций:
1. Запрос к СКУД не дал совпадений. Подписчики получат:
```
{
  "plane": "acs_verifications",
  "feed": "Feed 1" для подписчиков Feed 1 или "Feed 2" для подписчиков Feed 2,
  "acs_verification": {
    "request": {
      "feeds": ["Feed 1", "Feed 2"],
      ...
    },
    "result": null
  }
}
```
2. Запрос к СКУД дал совпадение. Пусть совпадение произошло с Feed 1. Подписчики
   получат:
```
{
 "plane": "acs_verifications",
 "feed": "Feed 1" для подписчиков Feed 1 или "Feed 2" для подписчиков Feed 2,
 "acs_verification": {
   "request": {
     "feeds": ["Feed 1", "Feed 2"],
     ...
   },
   "result": {
     "feed": "Feed 1",
     ...
   }
 }
}
```

### Событие сопоставления со списком СКУД
#### Пример
```
{
  "plane": "acs_matches",
  "acs_match" {
    <сопоставление со списком СКУД с гарантией, что поле card_holder не равно
     null (см. формат "СКУД: получение сопоставления со списком СКУД")>
  }
}
```

### Событие отсутствия совпадений с контрольными списками и списком СКУД
#### Пример
```
{
  "plane": "no_match",
  "no_match": {
    <захват (см. формат "Архив: получение захвата")>
  }
}
```
