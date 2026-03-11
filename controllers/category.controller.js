import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create({
      name: req.body.name,
      userId: req.userId,
      color: req.body.color,
    });

    res.status(201).json(category);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Operation failed" });
  }
};

export const getCategory = async (req, res) => {
  try {
    const categories = await Category.find({
      userId: req.userId,
      isDeleted: false,
    });

    res.json(categories);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: req.body.name, color: req.body.color },
      { new: true },
    );
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Operation failed" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDeleted: true },
    );
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Operation failed" });
  }
};
