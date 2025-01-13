"use client"
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {setToken} from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Input } from '@/components/ui/input'
import { Button } from '../button'

function LoginForm() {

    const router =useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault()
        setLoading(true)
        setError("")

        const formData=new FormData(event.currentTarget)

        try {
            const res=await fetch('http://localhost:3002/api/login',{
                method: 'POST',
                headers:{
                    'Content-Type':'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password:formData.get('password'),
                }),
            
            })

            const data=await res.json()

            if(!res.ok){
                throw new Error(data.message || 'Login failed')
            }

            setToken(data.token)
            router.push('/dashboard')
        }catch(err){
            setError(err instanceof Error ? err.message: 'Something went wrong')
        }finally{
            setLoading(false)
        }
    }
    
  return (
   <Card className='w-[350px]'>
    <CardHeader>
        <CardTitle>Login</CardTitle>
    </CardHeader>
    <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
                <Input
                id="email"
                name="email"
                type="email"
                placeholder='Email'
                required
                
                />

            </div>
            <div className='space-y-2'>
                <Input 
                id='password'
                name='password'
                type='password'
                placeholder='Password'
                required
                
                />
            </div>
            {error && (
                <div className='text-sm text-red-500'>
                    {error}
                </div>
            )}
            <Button type='submit' className='w-full' disabled={loading}>{loading ? "Loading...": "Login"}</Button>
        </form>
    </CardContent>
   </Card>
  )
}

export default LoginForm