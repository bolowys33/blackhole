const CategoryModel = require("../models/category.model")
const Product = require("../models/product.model")
const { empty } = require("../utils/helpers");
const validateData = require("../utils/validate");


// CREATE
async function createProduct (req, res) {
    try {
        // get the id of the logged-in vendor
        const user_id = req.user.id

        // destructure request body
        const {
            name,
            description,
            price,
            category_id,
            quantity
          } = req.body;
          
        // validate input
        const error = {};
        const validateRule = {
            name: "string|required",
            description: "string|required",
            price: "required",
            images: "array|min:1",
            category_id: "required",
            quantity: "min:1"
        };
        const validateMessage = {
            required: ":attribute is required",
            string: ":attribute must be a string"
            // number: ":attribute must be a number"
        };
        const validateResult = validateData(req.body, validateRule, validateMessage);
        if (!validateResult.success) {
            return res.json(validateResult.data);
        }

        // check if category exists
        const categoryExists = await CategoryModel.findById(category_id)
        if (empty(categoryExists)) {
            return res.json({ success: false, message: "Category not found" });
        }

        // check if vendor already has a product of the same name
        const existingProduct = await Product.findOne({ name : { $regex: name, $options: 'i' }}) // regex for case-insensitive search
        if (existingProduct && existingProduct.user_id == user_id) {
            return res.json({success: false, message: "You already have a product with same name"})
        }

        // access the uploaded file URLs from req.files (uploaded by multer)
        const image_default_url = 'https://pic.onlinewebfonts.com/thumbnails/icons_90947.svg'
        const image_urls = req.files ? req.files.map((file) => file.path) : [image_default_url]
        // check that user cannot upload more than 5 images
        if (image_urls.length > 5) {
            return res.status(400).json({ success: false, message: 'You can upload a maximum of 5 images' });
        }

        // create new product and save to database
        const newProduct = new Product({
            user_id,
            name,
            description,
            price,
            images: image_urls,
            category_id,
            quantity
        });

        await newProduct.save();

        res.json({success: true, message: 'Product created successfully', product: newProduct})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: 'Internal server error'})
    }
}

// READ OPERATIONS

// function to get all products
async function getProducts (req, res) {
    try {
        const products = await Product.find().select('-__v')
        res.json({success: true, products})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: 'Internal server error'})
    }
}

// function to get a product by id
async function getProductById (req, res) {
    try {
        const {productId} = req.params
        const product = await Product.findById(productId, '-__v')
        // check if product exists
        if (!product) {
            return res.json({success: false, message: 'Product not found'})
        }
        res.json({success: true, product})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: 'Internal server error'})
    }
}

// UPDATE
async function updateProduct (req, res) {
    try {
        const {productId} = req.params
        const product = await Product.findById(productId)
        // check if product exists
        if (!product) {
            return res.json({success: false, message: 'Product not found'})
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, {new: true})
        res.json({success: false, product: updatedProduct})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: 'Internal server error'})
    }
}

// DELETE
async function deleteProduct (req, res) {
    try {
        const {productId} = req.params
        const product = await Product.findById(productId)
        // check if product exists
        if (!product) {
            return res.json({success: false, message: 'Product not found'})
        }
        await Product.findByIdAndDelete(productId)
        res.json({success: true, message: 'Product deleted successfully'})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: 'Internal server error'})
    }
}

module.exports = {createProduct, getProducts, getProductById, updateProduct, deleteProduct}
