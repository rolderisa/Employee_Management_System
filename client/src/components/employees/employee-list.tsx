"use client"

import { getToken } from "@/lib/auth"
import { use, useEffect, useState } from "react"
import {Employee,PaginatedResponse} from '../../types/employee'
import { TableHeader, TableRow ,Table, TableHead, TableBody, TableCell} from "../ui/table"
import { Button } from "../ui/button"
function EmployeeList() {

    const [employees, setEmployees] = useState<Employee[]>([])
    const [page,setPage]=useState(1)
    const [totalPages,setTotalPages] = useState(1)
    const [error,setError]=useState("")
    const [loading,setLoading]= useState(true)

    useEffect(()=>{
        fetchEmployees()
    },[page])

    async function fetchEmployees(){
        try{
            const token=getToken()
            const res =await fetch(
                `http://localhost:3002/api/employees?page=${page}&limit=10`,{
                    headers:{
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            if (!res.ok){
                throw new Error('Failed to fetch employees')
            }

            const data: PaginatedResponse<Employee>=await res.json()
            setEmployees(data.data)
            setTotalPages(data.pagination.pages)

        }catch(err){
            setError(err instanceof Error ? err.message : 'Failed to load employees')
        }finally{
            setLoading(false)
        }
    }
    if (loading){
        return <div className="text-red-500">{error}</div>
    }
  return (
    <div className="space-y-4">
        <Table>
            <TableHeader>
                <TableRow>
                   <TableHead>ID</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Email</TableHead>
                   <TableHead>Department</TableHead>
                   <TableHead>Position</TableHead>
                   <TableHead>Laptop Details</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map((employee)=>(
                    <TableRow key={employee.id}>
                        <TableCell>{employee.id}</TableCell>
                        <TableCell>{`${employee.firstname} ${employee.lastname}`}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{`${employee.laptopManufacturer} ${employee.model} `}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        <div className="flex justify-center gap-2">
            <Button onClick={()=> setPage((p)=> Math.max(1,p -1))} disabled={page === 1} >Previous</Button>
            <Button onClick={()=> setPage((p)=>Math.min(totalPages, p +1))} disabled={page === totalPages}> Next</Button>
        </div>
    </div>
  )
}

export default EmployeeList