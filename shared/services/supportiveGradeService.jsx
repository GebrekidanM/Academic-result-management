import api from './api';
const API_URL = '/supportive-grades';

const getSheet = (gradeLevel, academicYear, semester) => {
        return api.get(`${API_URL}/sheet`, { 
            params: { gradeLevel, academicYear, semester } 
        });
    }

const saveGrades = (data) => {
        return api.post(`${API_URL}/save`, data);
    }

const getAll = () =>{return api.get(API_URL)}
const create = (data) => {
    console.log("hello I want",data)
    return api.post(API_URL, data)
}
const deleteSupportive = (id) => {return api.delete(`${API_URL}/${id}`)}


export default{
    getSheet,
    saveGrades,
    getAll,
    create,
    deleteSupportive
    
};