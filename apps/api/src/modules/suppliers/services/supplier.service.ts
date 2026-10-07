import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { Supplier } from '../models/supplier.model';
export class SupplierService {
 async list(tenantId:string, search='') { const query:any={tenantId}; if(search) query.$or=['name','contactName','email','rfc'].map(field=>({[field]:{$regex:search.replace(/[^a-zA-Z0-9 @._-]/g,''),$options:'i'}})); const data=await Supplier.find(query).sort({name:1}).limit(100).lean().exec(); return {data,pagination:{total:data.length,page:1,limit:100,hasMore:false}}; }
 async create(tenantId:string,input:Record<string,unknown>) { const name=String(input.name??'').trim(); if(!name) throw new AppError('VALIDATION_ERROR','El nombre del proveedor es obligatorio',400); return Supplier.create({...clean(input),tenantId,name}); }
 async update(tenantId:string,id:string,input:Record<string,unknown>) { if(!mongoose.isValidObjectId(id)) throw new AppError('VALIDATION_ERROR','Proveedor no válido',400); const item=await Supplier.findOneAndUpdate({_id:id,tenantId},{$set:clean(input)},{new:true,runValidators:true}).exec(); if(!item) throw new AppError('RESOURCE_NOT_FOUND','Proveedor no encontrado',404); return item; }
 async remove(tenantId:string,id:string) { if(!mongoose.isValidObjectId(id)) throw new AppError('VALIDATION_ERROR','Proveedor no válido',400); const item=await Supplier.findOneAndDelete({_id:id,tenantId}).exec(); if(!item) throw new AppError('RESOURCE_NOT_FOUND','Proveedor no encontrado',404); return {deleted:true}; }
}
function clean(input:Record<string,unknown>){const allowed=['name','contactName','email','phone','rfc','address','notes','status'];return Object.fromEntries(Object.entries(input).filter(([k])=>allowed.includes(k)));}
