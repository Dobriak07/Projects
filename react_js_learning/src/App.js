import React, { useMemo, useState } from 'react';
import PostFilter from './components/PostFilter';
import PostForm from './components/PostForm';
import PostList from './components/PostList';
import MyButton from './components/UI/button/MyButton';
import MyModal from './components/UI/MyModal/MyModal';
import './styles/App.css';

function App() {
  const [posts, setPosts] = useState([
    {id: 1, title: 'aa 1', body: 'dd'},
    {id: 2, title: 'bb 2', body: 'cc'},
    {id: 3, title: 'cc 3', body: 'bb'},
    {id: 4, title: 'dd 4', body: 'aa'}
  ])
  
  const [filter, setFilter] = useState({sort: '', query: ''});
  const [modal, setModal] = useState(false);

  const sortedPosts = useMemo(() => {
    console.log('Get Sorted Posts');
    if (filter.sort) return [...posts].sort((a, b) => a[filter.sort].localeCompare(b[filter.sort]))
    return posts;
  }, [filter.sort, posts]);

  const searchAndSortedPosts = useMemo(() => {
    return sortedPosts.filter(post => post.title.toLowerCase().includes(filter.query.toLowerCase()))
  }, [filter.query, sortedPosts])

  const createPost = (newPost) => {
    setPosts([...posts, newPost])
  }

  const removePost = (post) => {
    setPosts(posts.filter(p => p.id !== post.id));
  }

  return (
    <div className='App'>
      <MyButton onClick={() => setModal(true)}>
        Create Post
      </MyButton>
      <MyModal visible={modal} setVisible={setModal}>
        <PostForm create={createPost}/>
      </MyModal>
      <hr style={{margin: '15px 0'}}/>
      <PostFilter
        filter={filter}
        setFilter={setFilter}
      />
      <PostList remove={removePost} posts={searchAndSortedPosts} title={'Posts'}/>
    </div>
  );
}

export default App;
