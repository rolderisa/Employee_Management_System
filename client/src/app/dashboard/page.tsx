import EmployeeList from '@/components/employees/employee-list'
import EmployeeForm from '@/components/employees/employee-form'

export default function Dashboard(){
    return (
        <main className='container mx-auto py-10 space-y-10' >
            <h1 className='text-3xl font-bold'>Equipment Distribution System</h1>
            <div className='space-y-10'>
                <EmployeeForm/>
                <EmployeeList/>
            </div>
        </main>
    )
}