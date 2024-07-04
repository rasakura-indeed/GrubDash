const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find(order => order.id === orderId);
  
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
  
  function idMatchesOrderId(req, res, next) {
    const orderId = req.params.orderId;
    const { data: { id } = {} } = req.body;
    const idMatchesOrderId = id ? id === orderId : true;
    if(idMatchesOrderId) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  
  function hasDeliverTo(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    if (deliverTo) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a deliverTo`
    });
  }
  
  function hasMobileNumber(req, res, next) {
    const { data: { mobileNumber } = {} } = req.body;
    if (mobileNumber) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a mobileNumber`
    });
  }
  
  function hasDishes(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (dishes) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a dish`
    });
  }
  
  function validateOrderDishes(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (Array.isArray(dishes) && dishes.length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include at least one dish`
    });
  }
  
  function validateOrderDishQuantity(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    let dishesAreValid = true;
    let dishIndex = dishes.findIndex(
      (dish) => !dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity < 1
    );
  
    if(dishIndex == -1) {
      return next();
    }
    next({
      status: 400,
      message: `Dish ${dishIndex} must have a quantity that is an integer greater than 0`
    });
  }
  
  function validateOrderStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    const possibleStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if(possibleStatus.includes(status)) {
        return next();
    }
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    });
  }
  
  function validateOrderStatusNotDelivered(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(status !== "delivered") {
      return next();
    }
    next({
      status: 400,
      message: `A delivered order cannot be changed`
    });
  }
  

  function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      status,
      dishes
    };
  
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }
  
  function read(req, res) {
    res.json({ data: res.locals.order });
  }
  
  function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
  
    res.json({ data: order });
  }
  
  function destroy(req, res, next) {
    const orderId = req.params.orderId;
    const matchingOrder = orders.find((order) => order.id === orderId);
  
    if(matchingOrder.status === "pending") {
      const index = orders.findIndex((order) => order.id === Number(orderId));
      orders.splice(index, 1);
      res.sendStatus(204);
    }
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`
    })
  }
  
  function list(req, res) {
    res.json({ data: orders });
  }
  
  module.exports = {
    create: [
      hasDeliverTo,
      hasMobileNumber,
      hasDishes,
      validateOrderDishes,
      validateOrderDishQuantity,
      create
    ],
    read: [
      orderExists,
      idMatchesOrderId,
      read
    ],
    update: [
      orderExists,
      idMatchesOrderId,
      hasDeliverTo,
      hasMobileNumber,
      hasDishes,
      validateOrderStatus,
      validateOrderStatusNotDelivered,
      validateOrderDishes,
      validateOrderDishQuantity,
      update
    ],
    delete: [
      orderExists,
      idMatchesOrderId,
      destroy
    ],
    list
  }