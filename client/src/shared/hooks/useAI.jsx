import {useState,useCallback} from "react";
import aiClient from "../services/ai/aiClient";

const useAI=()=>{
    const[loading,setLoading]=useState(false);
    const[cache,setCache]=useState({});

    const run=useCallback(async(type,key,payload)=>{
        if(cache[key]) return cache[key];
        setLoading(true);

        try{
            const res = await aiClient[type](payload);
            setCache (p=>({...p,[key]:res.data.insight}));
            return res.data.insight;
        }catch(err){
            console.error(err);
        }
        finally{
            setLoading(false);
        }
        },[cache]);

    return{run,loading,cache};
};

export default useAI;