import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContents } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class TransactionsService {
  
  constructor(
    @InjectRepository(Transaction) 
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(TransactionContents)
    private readonly transactionContentsRepository: Repository<TransactionContents>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}

  async create(createTransactionDto: CreateTransactionDto) {

    await this.productRepository.manager.transaction(async( transactionEntityManager) => {
      const transaction = new Transaction()
      const total = createTransactionDto.contents.reduce((total, item) => total + (item.quantity * item.price), 0)
      transaction.total = total

      
      for(const contents of createTransactionDto.contents){
        const product = await transactionEntityManager.findOneBy(Product, {id: contents.productId})
        
        const errors = []

        if(!product){
          errors.push(`El producto con el ID: ${contents.productId} no existe`)
          throw new NotFoundException(errors)
        }

        if(contents.quantity > product.inventory){
          errors.push(`El artículo ${product.name} excede la cantidad disponible`)
          throw new BadRequestException(errors)
        }
        product.inventory -= contents.quantity

        // Create TransactionContents instance

        const transactionContent = new TransactionContents()
        transactionContent.price = contents.price
        transactionContent.product = product
        transactionContent.quantity = contents.quantity
        transactionContent.transaction = transaction

        await transactionEntityManager.save(transaction)
        await transactionEntityManager.save(transactionContent)
      }
    })
    


    return 'Venta Almacenada Correctamente';
  }

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
