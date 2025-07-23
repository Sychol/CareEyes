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

    const goTestLogin = () => {
        navigate('/test_login');
    };
    const goTestManager = () => {
        navigate('/test_manager');
    };
    const goTestWorker = () => {
        navigate('/test_worker');
    };

    return (
        <>
            <h1>React Router Page</h1>
            <div>
                <button onClick={goLogin}>로그인 페이지로 이동</button>
                <button onClick={goManager}>관리자 페이지로 이동</button>
                <button onClick={goWorker}>작업자 페이지로 이동</button>
            </div>

            <br /><hr /><br />

            <div>
                <button onClick={goTestLogin}>로그인 테스트 페이지로 이동</button>
                <button onClick={goTestManager}>관리자 테스트 페이지로 이동</button>
                <button onClick={goTestWorker}>작업자 테스트 페이지로 이동</button>
            </div>
        </>
    )
}

export default Home;