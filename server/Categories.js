import Fact from './Fact.js';

class Categories {
    constructor() {
        this.categoriesNumberCanChoose = 5;
        this.getFactsCount();
    }

    // Get facts count once when instance created
    async getFactsCount() {
        const allFacts = await Fact.find({}).exec();
        this.factsCount = allFacts.length;

        console.log(
            this.factsCount,
            ' fact(s) queried successfully, database connection is estabilished'
        );
    }

    // Get categories for choosing
    async getCategoriesForChoosing() {
        let random,
            fact,
            category,
            categories = [];

        do {
            // Get fact, and category
            random = Math.floor(Math.random() * this.factsCount);
            fact = await Fact.findOne().skip(random).exec();
            category = fact.category;

            // When category not added yet, push it
            if (!categories.includes(category)) {
                categories.push(category);
            }
        } while (categories.length < this.categoriesNumberCanChoose);

        return categories;
    }
}

export default Categories;
