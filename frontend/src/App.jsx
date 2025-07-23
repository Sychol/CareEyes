import { Route, Routes, useNavigate } from 'react-router-dom'
import './styles/App.css'

import Login from './pages/Login';
import Home from './pages/Home';
import Manager from './pages/Manager';
import Worker from './pages/Worker';

import Test_api from './tests/test_api';
import Test_ai from './tests/Test_ai';

function App() {

  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/manager' element={<Manager />}></Route>
          <Route path='/worker' element={<Worker />}></Route>

          <Route path='/test_ai' element={<Test_ai />}></Route>
          <Route path='/test_api' element={<Test_api />}></Route>
        </Routes>
      </div>
    </>
  );
}

export default App;