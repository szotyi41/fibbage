const Categories = required('../Categories');

const categories = new Categories();

test('Get random categories', () => {
    const categoriesToChoose = categories.getCategoriesForChoosing();
    expect(categoriesToChoose).toHaveLength(5);
});
