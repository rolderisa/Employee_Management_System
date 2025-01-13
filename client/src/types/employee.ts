export interface Employee{
    id:number;
    firstname:string;
    lastname:string;
    nationalIdentity:string;
    telephone:string;
    email:string;
    department:string;
    position:string;
    laptopManufacturer:string;
    model:string;
    serialNumber:string;
}

export interface PaginatedResponse<T>{
    data: T[];
    pagination:{
        total:number;
        page:number;
        pages:number;
    };
}