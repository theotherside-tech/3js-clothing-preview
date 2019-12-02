import {Field, Type} from 'serialize-ts';

export class AdjectiveTag {
    @Field()
    @Type(Number)
    id: number = 0;

    @Field()
    @Type(String)
    name: string;

    @Field()
    @Type(String)
    type: string;
}