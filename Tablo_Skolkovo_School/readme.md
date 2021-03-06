# REST Серевер для связи с табло в Сколково

[Donwload .exe](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/Dobriak07/Projects/tree/main/Tablo_Skolkovo_School/exe)

---
- [REST Серевер для связи с табло в Сколково](#rest-серевер-для-связи-с-табло-в-сколково)
  - [1. Структура файлов](#1-структура-файлов)
  - [2. Методы и их описание](#2-методы-и-их-описание)
  - [3. Табло старого образца](#3-табло-старого-образца)
  - [4. Табло нового образца](#4-табло-нового-образца)

---
   
## 1. Структура файлов
Основаня конфигурация хранится в .env файле. Структура файла следующая:
```
LOG_CONFIG_PATH="./app.logger.json"
SERVER_PORT='4545'
MOXA_IP='172.16.1.136'
MOXA_PORT_1=9001
MOXA_PORT_2=9002
```
***LOG_CONFIG_PATH*** - путь до файла с конфигом для логгера. В отсутствие файла создается новый по указанному пути

***SERVER_PORT*** - порт на котором запустится сервер с REST API

***MOXA_IP*** - IP адрес моксы

***MOXA_PORT_1*** - Порт для табло старого образца

***MOXA_PORT_1*** - Порт для табло нового образца

Уровень логирования по умолчанию "info". Можно сменить на "debug" для получения большого количества сообщений, однако может привести к замедлению работы сервиса.

Для удобства распространения приложение собрано в исполняемы файл .exe - это позволило избавиться от необходимости в установке NodeJS на целевой ПК.

---

## 2. Методы и их описание

1. Получение состояния подключения к Моксе (проверка доступности порта):
   ```
   Метод GET
   "http://<IP-адрес сервера>:<порт (SERVER_PORT)>/v1/tablo1" - проверка доступности 1 табло
   "http://<IP-адрес сервера>:<порт (SERVER_PORT)>/v1/tablo2" - проверка доступности 2 табло
   ```
2. Отправка данных для табло:
    ```
    Метод POST
    "http://<IP-адрес сервера>:<порт (SERVER_PORT)>/v1/tablo1" - отправка данных на 1 табло
    "http://<IP-адрес сервера>:<порт (SERVER_PORT)>/v1/tablo2" - отправка данных на 2 табло
    
    На вход ожидается json вида:

        {
            msg: "Строка"
        }

    Остальные пейлоады или json с неверными данными вернут ошибку. 

    Пример возвращаемой ошибки:
        
        {
            err: "Текст ошибки"
        }

    В случае успеха:

        {
            status: "Текст успешной отправки/состояния"
        }

    ```
---
## 3. Табло старого образца
По аналогии с более ранней интеграцией с табло в Сколково на вход ожидается строка:
```
"[p1][v1] Какой-то [nl] текст" - где [nl] перенос строки, [p1] пауза 0.5с, [v1] - скорость движения максимальная
```
Поскольку табло двустрочное добавлен метод переноса строки и возвращения каретки (2 кода в конце таблица ниже). Экспериментальный режим - необходима проверка
```
/* Эффекты паузы */

p0 - Отмена автопаузы – отменяет автоматическую паузу после эффектов появления
p1 - вставляет в сообщение паузу длительностью примерно 0,5 секунды
p2 - вставляет в сообщение паузу длительностью примерно 1 секунда
p3 - вставляет в сообщение паузу длительностью примерно 3 секунды
p4 - вставляет в сообщение паузу длительностью примерно 5 секунд
p5 - вставляет в сообщение паузу длительностью примерно 10 секунд
bl - однократное мигание
bi - инверсное мигание

/* Эффекты движения */

v1 - устанавливает скорость движения информации  1 (максимальная скорость движения информации).
v2 - устанавливает скорость движения информации  2
v3 - устанавливает скорость движения информации  3
v4 - устанавливает скорость движения информации  4
v5 - устанавливает скорость движения информации  5
v6 - устанавливает скорость движения информации  6 (самая медленная скорость).

/* Эффекты появления */

d0 - Появление снизу с замещением предыдущего текста
d1 - Появление снизу с замещением предыдущего текста
d2 - Появление сверху с замещением предыдущего текста
d3 - Появление снизу с выталкиванием предыдущего текста
d4 - Появление сверху с выталкиванием предыдущего текста
d5 - Плавное появление по точкам
d6 - Шторки к центру с замещением предыдущего текста
d7 - Шторки к центру с выталкиванием предыдущего текста
d8 - Шторки от центра с замещением предыдущего текста
d9 - Шторки от центра с выталкиванием предыдущего текста
d10 - Шторки к центру
d11 - Шторки от центра
d12 - Шторки горизонтальные к центру
d13 - Шторки горизонтальные от центра
d14 - Появление по буквам слева
d15 - Появление по буквам с вытягиванием
d16 - Появление по буквам  сверху
d17 - Появление по буквам снизу
d18 - Появление по буквам чередование
d19 - Появление по буквам печать
d20 - Движение справа налево с паузами
d21 - Движение слева направо с паузами

/* Эффекты центровки */

c0 - Выключает автоматическую центровку текста
c1 - Включает автоматическую центровку текста

/* Размер шрифта */

f6 - Переключает табло в режим вывода информации узким шрифтом (6х8 точек, возможно не работает на 2 строчном табло)
f8 - Переключает табло в режим вывода информации широким шрифтом (8х8 точек, возможно не работает на 2 строчном табло)

/* Перенос строки */

nl - Перенос строки

/* Возврат каретки */

rc - Возвращение каретки
```
---
## 4. Табло нового образца
Требует проверки работоспособности. Нюанс из документации полученный опытным путем - кодировка текса для табло СP1251
Присылать строго **CP1251**. Обратное перекодирование пока не предусмотрено.
Для первого подключения номер пакета для табло выбирается случайным образом из диапазона 200-255. Все последующие отправки идут по счетчику 0-200.
Из инструкции на табло данный функционал был сделан для повторной отправки в табло (для каких случаев не совсем понятно) без потери сохраненных данных.
В данный момент Код комманды для табло 23 - после отправки сообщения данные должны сразу обновиться на табло, но нужна проверка. В инструкции представлен лишь метод кода 22 - запись в ячейку табло с последующим вызовом. Если код 23 не прокатит, то переделаем на код 22.