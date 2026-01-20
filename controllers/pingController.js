exports.ping = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is alive ",
    timestamp: new Date().toISOString(),
  });
};
