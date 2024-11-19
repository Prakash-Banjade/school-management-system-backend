import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) { }

  async create(createEventDto: CreateEventDto) {
    const event = this.eventRepository.create(createEventDto);
    await this.eventRepository.save(event);

    return { message: 'Event created' };
  }

  async findAll(queryDto: EventsQueryDto) {
    const querybuilder = this.eventRepository.createQueryBuilder('event')
      .orderBy('event.createdAt', queryDto.order)
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(event.title) LIKE LOWER(:search)', { search: `%${queryDto.search}%` });
        queryDto.dateFrom && qb.andWhere('DATE(event.dateFrom) >= DATE(:dateFrom)', { dateFrom: queryDto.dateFrom });
        queryDto.dateTo && qb.andWhere('DATE(event.dateTo) <= DATE_ADD(DATE(:dateTo), INTERVAL 1 DAY)', { dateTo: queryDto.dateTo });
      }))
      .select(['event.id', 'event.createdAt', 'event.title', 'event.description', 'event.dateFrom', 'event.dateTo', 'event.eventLocation', 'event.members'])

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      select: ['id', 'createdAt', 'title', 'description', 'dateFrom', 'dateTo', 'eventLocation', 'members'],
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);

    const updatedEvent = Object.assign(event, updateEventDto);

    await this.eventRepository.save(updatedEvent);

    return { message: 'Event updated', success: true };
  }

  async remove(id: string) {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);

    return { message: 'Event deleted' };
  }
}
