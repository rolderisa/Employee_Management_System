import {jwtDecode} from 'jwt-decode'

export const setToken= (token: string)=>{
    localStorage.setItem('token', token);
};

export const getToken = () =>{
    return localStorage.getItem('token');
};
export const isAutheticated = () => {
    const token = getToken();
    if (!token) return false;

    try{
        const decoded=jwtDecode(token);
        return decoded.exp! * 1000 > Date.now();
    }catch{
        return false;
    }
}
