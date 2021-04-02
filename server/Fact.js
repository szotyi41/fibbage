import mongoose from 'mongoose';
const { Schema } = mongoose;

mongoose.connect('mongodb://root:password@localhost:27017/fibbage', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const FactSchema = new Schema({
    fact: String,
    info: String,
    category: String,
    recommended: Array,
    correct: String
});

const Fact = mongoose.model('Facts', FactSchema, 'Facts');

export default Fact;
