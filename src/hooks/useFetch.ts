import axios from 'axios';

export const BASE_URL = 'https://documents-225250995708.europe-west1.run.app/api';
//export const BASE_URL ='http://192.168.18.94:1337/api'
type FetchDataTypes = {endPoint: string; method: 'POST' | 'GET' | 'UPDATE' | 'DELETE'; data?: any;};

const useFetch = () => {

    const fetchData = async ({ endPoint, method, data }: FetchDataTypes) => {
        try {
            const url = BASE_URL + endPoint;
            const headers: any = {
                'Content-Type': 'application/json',
                'Accept': 'application/zip,application/json',
            };
            let response = await axios({method, url, data, headers});
            return response.data;
        } catch (error: any) {
            console.error('Error fetching data:', error);
            return false;
        }
    }

    return { fetchData };
};

export default useFetch;
