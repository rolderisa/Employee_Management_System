"use client"
import React from 'react'
import {getToken} from '@/lib/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

function EmployeeForm() {

    const router =useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault()
        setLoading(true)
        setError("")

        const formData=new FormData(event.currentTarget)
        const token=getToken()

        try{
            const res=await fetch('http://localhost:3002/api/employees',{
                method:'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Authorization':`Bearer ${token}`,
                },
                body:JSON.stringify({
                    firstname:formData.get('firstname'),
                    lastname:formData.get('lastname'),
                    nationalIdentity:formData.get('nationalIdentity'),
                    telephone:formData.get('telephone'),
                    email:formData.get('email'),
                    department:formData.get('department'),
                    position:formData.get('position'),
                    model:formData.get('model'),
                    laptopManufacturer:formData.get('laptopManufacturer'),
                    serialNumber: formData.get('serialNumber')
                }),
            })
            const data= await res.json()
            if(!res.ok){
                throw new Error(data.message || 'Failed to add employee')
            }

            router.push('/dashboard')
            router.refresh()
        }catch(err){
            console.error("Error:", err);

            setError(err instanceof Error ? err.message : "Something went wrong")
        }finally {
            setLoading(false)
        }

    }

    return (

      
        <Card className='w-full max-w-2xl'>
          
            <CardHeader>
                <CardTitle>
                    Add New Employee
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <form onSubmit={onSubmit} className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <Input
                        name="firstname"
                        placeholder="First Name"
                        required
                        />

<Input
              name="lastname"
              placeholder="Last Name"
              required
            />
            <Input
              name="nationalIdentity"
              placeholder="National Identity"
              required
            />
            <Input
              name="telephone"
              placeholder="Telephone"
              required
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
            />
            <Input
              name="department"
              placeholder="Department"
              required
            />
            <Input
              name="position"
              placeholder="Position"
              required
            />
            <Input
              name="laptopManufacturer"
              placeholder="Laptop Manufacturer"
              required
            />
            <Input
              name="model"
              placeholder="Model"
              required
            />
            <Input
              name="serialNumber"
              placeholder="Serial Number"
              required
            />
          
                    </div>
                    {error && (
                        <div className='text-sm text-red-500'>{error}</div>
                    )}
                    <Button type='submit' className='w-full' disabled={loading}>
                        {loading ? "Adding..." : "Add Employee"}
                    </Button>
                 </form>
            </CardContent>
        </Card>
    )


    
 }

export default EmployeeForm