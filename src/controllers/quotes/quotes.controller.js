const CREATE_QUOTE = async (req, res) => {
  try {
  } catch (error) {
    console.error("ERROR IN CREATE_QUOTE:", error);
    return res.status(500).json({
      message: "Error CREATE_QUOTE. Please try again later.",
    });
  }
};

module.exports = {
  CREATE_QUOTE,
};
