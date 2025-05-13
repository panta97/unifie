import React from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectFormOrderState } from '../../../app/slice/order/formSlice'
import { selectCompanyId, updateCompany } from '../../../app/slice/order/orderDetailsSlice'
import { ProductFormState } from '../../../types/product'

export const SelectWarehouse = () => {
    const formState = useAppSelector(selectFormOrderState)
    const companyId = useAppSelector(selectCompanyId)
    const dispatch = useAppDispatch()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (formState === ProductFormState.CREATED) return
        dispatch(updateCompany({ company_id: parseInt(e.target.value, 10) }))
    }

    return (
        <div className="inline-flex flex-col mr-1 text-xs">
            <label htmlFor="warehouse">Almacén</label>
            <select
                id="warehouse"
                value={companyId}
                onChange={handleChange}
                className="border rounded text-sm"
            >
                <option value={1}>KDOSH ABTAO</option>
                <option value={3}>KDOSH SAN MARTIN</option>
                <option value={2}>KDOSH TINGO MARIA</option>
                <option value={4}>KDOSH WEB</option>
            </select>
        </div>
    )
}
