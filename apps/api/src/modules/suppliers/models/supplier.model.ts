import { Schema, model } from 'mongoose';
export interface ISupplier { tenantId:string; name:string; contactName:string; email:string; phone:string; rfc:string; address:string; notes:string; status:'active'|'inactive'; }
const supplierSchema = new Schema<ISupplier>({ tenantId:{type:String,required:true,index:true}, name:{type:String,required:true,trim:true,maxlength:200}, contactName:{type:String,default:'',trim:true,maxlength:200}, email:{type:String,default:'',trim:true,lowercase:true,maxlength:254}, phone:{type:String,default:'',trim:true,maxlength:40}, rfc:{type:String,default:'',trim:true,uppercase:true,maxlength:20}, address:{type:String,default:'',trim:true,maxlength:300}, notes:{type:String,default:'',maxlength:1000}, status:{type:String,enum:['active','inactive'],default:'active',index:true} },{timestamps:true});
supplierSchema.index({tenantId:1,name:1});
export const Supplier=model<ISupplier>('Supplier',supplierSchema);
