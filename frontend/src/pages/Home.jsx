import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/App.css'

const Home = () => {
    const navigate = useNavigate();

    const goLogin = () => {
        navigate('/login');
    };
    const goManager = () => {
        navigate('/manager');
    };
    const goWorker = () => {
        navigate('/worker');
    };

    return (
        <>
            <h1>React Router Page</h1>
            <button onClick={goLogin}>로그인 페이지로 이동</button>
            <button onClick={goManager}>관리자 페이지로 이동</button>
            <button onClick={goWorker}>작업자 테스트 페이지로 이동</button>
        </>
    )
}

export default Home;