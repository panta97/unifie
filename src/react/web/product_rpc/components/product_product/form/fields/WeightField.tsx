import React,{useEffect} from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";

import { selectProductFamilyId,
         selectProductWeight,   
         updateWeight,

} from "../../../../app/slice/product/productSlice";
    

export const WeightField = () =>{
    const familyId = useAppSelector(selectProductFamilyId);
    const weight = useAppSelector(selectProductWeight);
    const dispatch = useAppDispatch();
    
    
    useEffect(()=>{
        
        const fetchWeightFromBackend =async () => {
            try{
                const response = await fetch(`http://127.0.0.1:8000/api/product-rpc/weights`);
                const data = await response.json();
                const weightList  = data.weight_list;
                const categoryWeight = weightList.find((item)=>item.fk_product_category_id === familyId);
                if (categoryWeight) {
                    dispatch(updateWeight({weight:parseInt(categoryWeight.weight)}));
                }     
                
            }catch (error){
                console.log('Error al obtener peso del producto:', error);
            }            
        };
        
        if (familyId !== 0) {
            fetchWeightFromBackend();
        }
    }, [familyId, dispatch]);

    const handleWeight = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWeight = parseInt(e.target.value);
        dispatch(updateWeight({ weight: newWeight }));
    };

    return(
        <div className="inline-flex flex-col w-40 mr-1">
            <label htmlFor="product_weight" className="text-xs">
                Peso en g.
            </label>
            <input
            className="border-b-2 border-gray "
            type="number"
            autoComplete=""
            spellCheck={false}
            value={weight}
            onChange={handleWeight}
            id="product_weight"
            ></input>

        </div>
    );
    
};

