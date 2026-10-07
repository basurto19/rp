import type { Request, Response } from 'express';
import { successResponse,errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';
import { SupplierService } from '../services/supplier.service';
export class SupplierController { private readonly service=new SupplierService();
 async list(req:Request,res:Response){return successResponse(res,await this.service.list((req as any).tenantId,typeof req.query.search==='string'?req.query.search.slice(0,100):''));}
 async create(req:Request,res:Response){try{return successResponse(res,await this.service.create((req as any).tenantId,req.body??{}),201,'Proveedor creado.');}catch(e){if(e instanceof AppError)return errorResponse(res,e);throw e;}}
 async update(req:Request,res:Response){try{return successResponse(res,await this.service.update((req as any).tenantId,String(req.params.id),req.body??{}),200,'Proveedor actualizado.');}catch(e){if(e instanceof AppError)return errorResponse(res,e);throw e;}}
 async remove(req:Request,res:Response){try{return successResponse(res,await this.service.remove((req as any).tenantId,String(req.params.id)));}catch(e){if(e instanceof AppError)return errorResponse(res,e);throw e;}}
}
