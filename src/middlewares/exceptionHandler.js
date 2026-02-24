const exceptionHandler = (err, _, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
};

export default exceptionHandler;
