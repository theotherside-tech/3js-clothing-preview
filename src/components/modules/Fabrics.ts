import {Field, Type} from 'serialize-ts';
import {OutfitItem, PerOutfitItemData} from './OutfitItem';

class Fabric {
    @Field()
    @Type(Number)
    id: number = 0;

    @Field()
    @Type(Boolean)
    soldOut: false;

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

    @Field()
    @Type(String)
    fabricLine: string = '0';


    @Field()
    @Type(String)
    primaryColor: string = '0';

    @Field()
    @Type(String)
    primaryPattern: string = '0';

    @Field()
    @Type(String)
    secondaryColor: string = '0';

    @Field()
    @Type(String)
    secondaryPattern: string = '0';


    @Field()
    @Type(String)
    material: string = '0';

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