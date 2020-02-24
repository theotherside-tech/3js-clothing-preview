enum OutfitItem {
    None = 0,
    Jacket = 1,
    Pants = 2,
    Shirt = 4,
    Shoes = 8
}

const OutfitItems: OutfitItem[] = [OutfitItem.Jacket, OutfitItem.Pants, OutfitItem.Shirt, OutfitItem.Shoes];

function getName(item: OutfitItem): string {
    switch (item) {
        case OutfitItem.Jacket:
            return "Jacket";
        case OutfitItem.Pants:
            return "Pants";
        case OutfitItem.Shirt:
            return "Shirt";
        case OutfitItem.Shoes:
            return "Shoes";
    }
}

class PerOutfitItemData<T> extends Map<OutfitItem, T> {
    constructor(defaultValue: T = null) {
        super(null);
        this.set(OutfitItem.Jacket, defaultValue);
        this.set(OutfitItem.Pants, defaultValue);
        this.set(OutfitItem.Shirt, defaultValue);
        this.set(OutfitItem.Shoes, defaultValue);
    }

    checkDataEqualityFunction: (me: T, other: T) => boolean = (me, other) => me === other;

    equals(other: PerOutfitItemData<T>) {
        if (other == null)
            return false;

        for (var [key, value] of this)
            if (!this.checkDataEqualityFunction(value, other.get(key)))
                return false;
        
        return true;
    }
}

export {PerOutfitItemData, OutfitItem, getName, OutfitItems}