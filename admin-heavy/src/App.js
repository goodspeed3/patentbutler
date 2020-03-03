import React from 'react';
import './App.css';

import { Admin , Resource, ListGuesser, EditGuesser } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { UserList } from './users';
import { PostList, PostEdit, PostCreate } from './posts';

import authProvider from './authProvider';


const dataProvider = jsonServerProvider('http://jsonplaceholder.typicode.com');
const App = () => (
  <Admin authProvider={authProvider} dataProvider={dataProvider}>
    <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate}  />
    <Resource name="users" list={UserList} />  
  </Admin>
  
);

export default App;
