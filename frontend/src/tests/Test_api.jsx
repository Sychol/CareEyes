import React from 'react'

const Test_api = () => {
    const [data, setData] = useState('');
    useEffect(() => {
        axios.get('/api/data')
            .then(res => setData(res.data))
            .catch(err => console.log(err))
    }, []);
    return (
        <>
            <div>
                Spring API TEST : {data}
            </div>
        </>
    )
}

export default Test_api