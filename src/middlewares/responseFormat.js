import { HTTP_STATUS } from "#config/constants.js";

const responseFormat = (_, res, next) => {
  res.success = (data, status = HTTP_STATUS.ok, props = {}) => {
    res.status(status).json({
      status: "success",
      data,
      ...props,
    });
  };
  res.error = (error, status = HTTP_STATUS.BAD_REQUEST, prop) => {
    res.status(status).json({
      status: "error",
      error,
      ...prop,
    });
  };
  res.unauthorized = () => {
    res.error("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  };
  next();
};

export default responseFormat;
