import {Field, Type} from 'serialize-ts';
import {OutfitItem, PerOutfitItemData} from './OutfitItem';

class Fabric {
    @Field()
    @Type(Number)
    id: number = 0;

    @Field()
    @Type(String)
    name: string;

    @Field()
    @Type(String)
    url: string;

    @Field()
    @Type(Number)
    appliesTo: OutfitItem;

    @Field()
    @Type(Number)
    scale: number;

    equals(other: Fabric) {
        return other != null && this.id === other.id;
    }
}

class PerOutfitItemFabrics extends PerOutfitItemData<Fabric> {
    constructor() {
        super(null);
        this.checkDataEqualityFunction = (me, other) => me != null && me.equals(other);
    }
}

export {Fabric, PerOutfitItemFabrics}