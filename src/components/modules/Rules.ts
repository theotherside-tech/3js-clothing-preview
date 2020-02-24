import {Field, Type} from 'serialize-ts';
import {AdjectiveTag} from './Adjectives';

export class Rule {
    @Field()
    @Type(Number)
    id: number = 0;

    @Field()
    @Type(Boolean)
    negativeRule = false;

    @Field()
    @Type(Number)
    conditionOutfitParts = 0;

    @Field()
    @Type(Number)
    recommendedOutfitParts = 0;
    
    conditionAttribute: AdjectiveTag;

    recommendedAttribute: AdjectiveTag;
}