import React from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {

    const navigate = useNavigate();

    const goManager = () => {
        navigate('/manager');
    };
    const goWorker = () => {
        navigate('/worker');
    };
    return (
        <>
            <h1>Login Page</h1>
            <button onClick={goManager}>관리자 페이지로 이동</button>
            <button onClick={goWorker}>작업자 테스트 페이지로 이동</button>
        </>
    )
}

export default Login