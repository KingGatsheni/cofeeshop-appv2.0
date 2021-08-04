import './App.css';
import React, { useState, useEffect, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, Button, Col, Row, Image, Container, Form } from 'react-bootstrap'
import api from './api/axios';
import gif from './assets/cart.gif'
import jwtDecode from 'jwt-decode';


function App() {
    //state variables
    const [products, setProduct] = useState([])
    const [cart, setCart] = useState([])
    const [search, setSearch] = useState('')
    const [page, setPage] = useState('products')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [residence, setResidence] = useState('')
    const [userState, setUserState] = useState(false)
    const [user, setUser] = useState({})
    const [checkoutState, setCheckoutState] = useState(false)

    const paypal = useRef()
    /*Methods */
    const GetAllProducts = () => {
        api.get('/api/products').then((p) => {
            setProduct(p.data);
        }).catch(err => {
            console.log(err);
        })
    }

    useEffect(() => {
        GetAllProducts();
        let token = localStorage.getItem('token')
        try {
            if (token !== undefined) {
                const { exp } = jwtDecode(token)
                let time = (exp * 1000) - 60000;
                if (Date.now() < time) {
                    setUserState(true)
                }
            } else {
                console.log("token does not exist")
            }
        } catch (e) {
            console.log(e.message)
        }

        var price = getTotalSum() /14.40
        var p = price.toFixed(2)
        console.log(p)
        window.paypal.Buttons({
            createOrder: (data, actions, err) => {
                return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            description: "coffeeshop order",
                            amount: {
                                currency_code: "USD",
                                value:p
                            }

                        }
                    ]
                })
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                console.log(order);
                sendOrder();
                setPage('cart')
                setCart([])
            },
            onError: (err) => { console.log(err.message) }
        }).render(paypal.current)
    },[,checkoutState])

    if (!products) {
        return null;
    }

    const AddToCart = (product) => {
        let newCart = [...cart]
        let itemInCart = newCart.find((item) => product.productId === item.productId)
        if (itemInCart) {
            itemInCart.quantity++
        } else {
            itemInCart = {
                ...product,
                quantity: 1
            }
            newCart.push(itemInCart)
        }
        setCart(newCart)
    }
    const RemoveFromCart = (productToRemove) => {
        setCart(cart.filter((item) => item !== productToRemove))
    }

    const sendOrder = () => {
        let jwt = localStorage.getItem('token')
        let headers = {
            'Authorization': `Bearer ${jwt}`}
        console.log(headers)
        try {
            api.post('/api/orders', { totalPrice: getTotalSum(), orderStatus: false, customerId: user.userId },{headers: headers}).then((res) => {
            })
            cart.map((orderItem) => {
                api.get('/api/orders', {headers:headers}).then((i) => {
                    var orId = i.data[i.data.length - 1]
                    console.log(orId)
                    api.post('/api/orderitems', { orderId: orId.orderId + 1, productId: orderItem.productId, quantity: orderItem.quantity }, {headers:headers}).then((data) => {
                        console.log('sucessfully posted orderitem data')
                    }).catch((err) => console.log(err))
                })

            })

        } catch (err) {
            console.log(err);
        }
    }

    const getTotalSum = () => {
        return cart.reduce((sum, { productPrice, quantity }) => sum + productPrice * quantity, 0)
    }

    const getCartTotal = () => {
        return cart.reduce((sum, { quantity }) => sum + quantity, 0)
    }

    const increment = (i) => {
        setQuantity(i, i.quantity + 1)
    }

    const decrement = (d) => {
        if (d.quantity !== 1) {
            setQuantity(d, d.quantity - 1)
        }
    }
    const setQuantity = (product, amount) => {
        let newCart = [...cart]
        newCart.find((item) =>
            item.productId === product.productId
        ).quantity = amount;
        setCart(newCart)
    }

    const checkLogin = () => {
        var token = localStorage.getItem('token')
        try {
            if (token !== undefined) {
                const { exp } = jwtDecode(token);
                const expirationTime = (exp * 1000) - 60000;
                if (Date.now() >= expirationTime) {
                    setPage('login')
                } else {
                    setPage('checkout')
                    CurrentUser();
                }
            } else {
                console.log('Invalid token')
            }
        } catch (e) {
            console.log(e.message)
            setPage('login')
        }



    }

    const Signup = () => {
        if (!password.length < 8) {
            api.post('account/customers/register', { firstName: firstName, lastName: lastName, email: email, phoneNumber: phone, residence: residence, password: password }).then((res) => {
                setPage('login');
            }).catch((err) => {
                console.log(err.message)
            })
        }

    }

    const SignIn = () => {
        api.post('/account/customers/auth', { email: email, password: password }).then((res) => {
            let token = res.data.token;
            if (token !== null && cart.length > 0) {
                setPage('checkout')
                localStorage.clear()
                localStorage.setItem('token', token);
                setUserState(true)
                CurrentUser();
            } else {
                setPage('products')
                localStorage.clear()
                localStorage.setItem('token', token);
                setUserState(true)
            }
        }).catch((err) => {
            console.log(err.message);
        })
    }

    const parseJwt = (token) => {
        if (!token) {
            return
        }
        const base64url = token.split('.')[1];
        const base64 = base64url.replace('-', '+').replace('_', '/');
        const { sub } = JSON.parse(window.atob(base64))
        return sub;
    }

    const logout = () => {
        setUserState(false)
        localStorage.clear()
        setPage('products')
    }

    const CurrentUser = () => {
        let token = localStorage.getItem('token')
        let data = parseJwt(token)
        let currentUser = {
            "userId": data[0],
            "fullName": data[1] + " " + data[2],
            "email": data[3],
            "phone": data[4],
            "res": data[5]
        }
        setUser(currentUser)
    }


    //RENDER UI COMPONENTS METHODS
    const renderProducts = () => (
        <div style={{ paddingLeft: '200px', margin: '10px' }}>
            <h1 style={{ textAlign: 'center', fontSize: "50px", fontFamily: 'fantasy' }}>Products</h1>
            <div className="products">
                {
                    products.filter((item) => {
                        if (search === "") {
                            return item;
                        } else if (item.productName.toLowerCase().includes(search.toLowerCase())) {
                            return item;
                        }
                    }).map((product) => {
                        return (
                            <div class="card" style={{ width: '220px', height: '340px', marginBottom: '20px', fontFamily: 'fantasy', fontSize: '18.5px' }} key={product.productId}>
                                <img style={{ height: '43%', width: '90%' }} src={"http://localhost:8000/public/" + product.productImage} alt={product.productName} />
                                <div class="card-body">
                                    <h4 class="card-title">{product.productName}</h4>
                                    <h6 class="card-text">R{product.productPrice}</h6>
                                    <h6 class="card-text"> {product.packSize}</h6>
                                    <a href="#" style={{ float: 'below' }} class="btn btn-secondary" onClick={() => { AddToCart(product) }} >
                                        Add To Cart
                                    </a>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )

    const renderCart = () => {

        return (
            cart.length !== 0 ? (
                <div className="App">
                    <h2 style={{ textAlign: 'justify', marginBottom: '0px', marginLeft: '120px' }}>Shopping Cart</h2>
                    <Row>
                        <Col sx lg="8">
                            {
                                cart.map((product) => {
                                    return (
                                        <div>
                                            <div class="card" style={{ width: '850px', padding: '8px', marginLeft: '130px', marginTop: '20px', marginBottom: '15px' }} key={product.productId}>
                                                <Row>
                                                    <Col sx lg="2">
                                                        <img style={{ width: '160px', height: '160px', alignContent: 'space-around' }} src={"http://localhost:8000/public/" + product.productImage} alt={product.productName} />
                                                    </Col>
                                                    <Col>
                                                        <div style={{ fontFamily: 'fantasy', fontSize: '18.5px' }} class="card.body">
                                                            <Row>
                                                                <Col>
                                                                    <p style={{ textAlign: 'justify', fontSize: "28px" }} class="card.title" >{product.productName} {product.packSize}    </p>
                                                                </Col>
                                                                <Col>
                                                                    <p style={{ textAlign: 'right', fontSize: '28px' }} class="card.text">R{product.productPrice}</p>
                                                                </Col>
                                                            </Row>
                                                            <Button onClick={() => increment(product)} variant="btn btn-primary" style={{ fontFamily: 'fantasy', fontSize: '12px', float: 'right' }}>
                                                                +
                                                            </Button>

                                                            <Button variant="secondary" style={{ fontFamily: 'fantasy', fontSize: '14px', float: 'right', marginLeft: '4px', marginRight: '4px' }}>
                                                                {product.quantity}
                                                            </Button>

                                                            <Button onClick={() => decrement(product)} variant="btn btn-primary" style={{ fontFamily: 'fantasy', fontSize: '12px', float: 'right' }}>
                                                                -
                                                            </Button>
                                                            <p style={{ textAlign: 'left', fontSize: '12px', padding: '5px' }} class="card.text">{product.discription}</p>

                                                            <button style={{ float: 'right', fontSize: '15.5px', marginBottom: '0px' }} variant="secondary" onClick={() => RemoveFromCart(product)}>Remove</button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    )
                                })}
                        </Col>
                        <Col>
                            <div class="card" style={{ width: '360px', padding: '20px', marginLeft: '20px', marginTop: '20px' }}>

                                <div class="card.body">
                                    <h3 style={{ fontFamily: 'fantasy', fontSize: '30px', marginRight: '0px' }} class="card-title"> Cart Summary</h3>
                                    <Row sx lg="2">
                                        <Col>
                                            {<p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginLeft: '50px', marginTop: '50px', textAlign: 'center' }} class="card.text">Total(item {getCartTotal()})</p>}
                                        </Col>
                                        <Col>
                                            {getTotalSum() !== 0 ? <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginRight: '0px', marginTop: '50px' }} class="card.text"> R{getTotalSum()}</p> : <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginRight: '0px', marginTop: '50px' }} class="card.text"> R0,00</p>}
                                        </Col>
                                    </Row>
                                    {<Button onClick={() => checkLogin()} style={{ alignSelf: 'end' }} variant="btn btn-primary" size="md" >Proceed To CheckOut</Button>}
                                </div>
                            </div>
                            <div class="card" style={{ width: '360px', padding: '20px', marginLeft: '20px', marginTop: '10px' }}>

                                <div style={{ fontFamily: 'fantasy', fontSize: '16.5px', textAlign: 'start', fontWeight: 'lighter' }} class="card.body">
                                    <p class="card-title">Secure checkout</p>
                                    <p class="card.text">May Ways To Pay</p>
                                    <p class="card.text">Reliable Delivery</p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            ) : NoItem()
        )
    }

    const renderSearchArea = () => (
        <div style={{ padding: '10px', fontFamily: 'fantasy' }}>
            <Row>
                <Col >
                    <p style={{ adding: '10px', fontFamily: 'fantasy', fontSize: '20.5px', color: 'white' }}>Search by Name</p>
                </Col>
                <Col sx lg="2">

                    <input style={{ width: '479px' }} type="search" placeholder="Search" class="form-control" aria-label="Search"
                        aria-describedby="search-addon" placeholder="Search here..." onChange={(e) => {
                            setSearch(e.target.value);
                        }} />
                </Col>
                <Col>
                    <Dropdown>
                        <Dropdown.Toggle id="dropdown-button-dark-example1" variant="secondary">
                            All Products
                        </Dropdown.Toggle>

                        <Dropdown.Menu variant="dark">
                            <Dropdown.Item href="#/action-1" active>
                                All Products
                            </Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Robusta Beans</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Arabia Beans</Dropdown.Item>
                            <Dropdown.Item href="#/action-4">Liberica</Dropdown.Item>
                            <Dropdown.Item href="#/action-4">Excelsa</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
        </div>
    )

    const NoItem = () => (
        <div style={{ fontFamily: 'fantasy' }} >
            <h2 style={{ textAlign: 'justify', marginBottom: '30px', marginLeft: '100px' }}>Shopping Cart</h2>
            <div style={{ width: '1200px', height: '300px', marginLeft: '100px' }} class="card">
                <Image style={{ width: '140px', height: '140px', marginLeft: '500px', marginTop: '70px' }} src={gif} alt="no image" />
                <p style={{ fontSize: '18.5px' }}>Your Shopping Cart is empty</p>
                <button onClick={() => setPage('products')} style={{ marginLeft: '500px', marginRight: '500px' }} class="btn btn-primary">Continue Shopping</button>
            </div>
        </div>
    )

    const renderCheckout = () => (
        <div className="App">
            <h2 style={{ textAlign: 'justify', marginBottom: '0px', marginLeft: '120px' }}>Checkout</h2>
            <Row>
                <Col sx lg="8">

                    <div>
                        <div class="card" style={{ width: '850px', padding: '25px', marginLeft: '130px', marginTop: '20px', marginBottom: '15px' }}>
                            <Row>

                                <Col>
                                    <div style={{ fontFamily: 'fantasy', fontSize: '18.5px' }} class="card.body">
                                        <Row>
                                            <Col>
                                                <p style={{ textAlign: 'left', fontSize: '22.5px', padding: '1px' }} class="card.text">Delivery Address</p>
                                            </Col>
                                            <Col>
                                                <button style={{ float: 'right', fontSize: '17.5px' }} variant="secondary">Add Address</button>
                                            </Col>
                                        </Row>
                                        <div style={{ padding: '10px', backgroundColor: '#DBF3FA' }} class="card">
                                            <Row>
                                                <Col>

                                                    <p style={{ textAlign: 'left', fontSize: '16px' }}>{user.fullName}</p>
                                                    <p style={{ textAlign: 'left', fontSize: '14px' }}>{user.email}</p>
                                                    <p style={{ textAlign: 'left', fontSize: '14px' }}>{user.res}</p>
                                                    <p style={{ textAlign: 'left', fontSize: '12px' }}>{user.phone}</p>
                                                </Col>
                                                <Col sx lg="2">
                                                    <Row >
                                                        <Col>
                                                            <a style={{ textAlign: '' }} href="#">Delete</a>
                                                        </Col>
                                                        <Col>
                                                            <a style={{}} href="#">Edit</a>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>

                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
                <Col>
                    <div class="card" style={{ width: '360px', padding: '10px', marginLeft: '20px', marginTop: '20px' }}>

                        <div class="card.body">
                            <h3 style={{ fontFamily: 'fantasy', fontSize: '30px', marginBottom: '10px' }} class="card-title"> Checkout Summary</h3>
                            <Row>
                                <Col>
                                    <p style={{ fontFamily: 'fantasy', fontSize: '16.5px', textAlign: 'left' }} class="card.text">Items({getCartTotal()}) </p>
                                </Col>
                                <Col>
                                    <p tyle={{ fontFamily: 'fantasy', fontSize: '16.5px', textAlign: 'left' }}>R{getTotalSum()}</p>
                                </Col>
                            </Row>
                            <p>----------------------------------------------------------------</p>
                            <Row>
                                <Col>
                                    <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', textAlign: 'left' }} class="card.text">TO PAY</p>
                                </Col>
                                <Col>
                                    <p style={{ fontFamily: 'fantasy', fontSize: '24.5px', color: 'green' }}>R{getTotalSum()}</p>
                                </Col>
                            </Row>
                            {checkoutState ? renderPay() : <Button onClick={() => setCheckoutState(true)} variant="btn btn-primary" size="md" >Pay Now</Button>}

                        </div>
                    </div>
                    <div class="card" style={{ width: '360px', padding: '20px', marginLeft: '20px', marginTop: '10px' }}>

                        <div style={{ fontFamily: 'fantasy', fontSize: '16.5px', textAlign: 'start', fontWeight: 'lighter' }} class="card.body">
                            <p style={{ fontSize: '20px', fontWeight: 'bold' }} class="card-title">Order Review</p>
                            <p class="card.text">Delivery Method</p>
                        </div>
                    </div>

                </Col>
            </Row>
        </div>
    )

    const renderLogin = () => (
        <div className="Login">
            <Form >
                <Form.Group size="lg" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        autoFocus
                        type="email"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        onChange={(x) => {
                            setPassword(x.target.value)
                        }}
                    />
                </Form.Group>
                <Button onClick={() => SignIn()} style={{ width: '200px', margin: '5px' }} block size="lg" type="submit">
                    Login
                </Button>
                <p onClick={() => setPage('register')} style={{ fontWeight: 'lighter' }}> Sign Up new Account ?</p>
            </Form>
        </div>
    )

    const renderRegister = () => (
        <div className="Login">
            <Form >
                <Form.Group size="lg" controlId="name">
                    <Form.Label>FirstName</Form.Label>
                    <Form.Control
                        autoFocus
                        type="name"
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="name">
                    <Form.Label>LastName</Form.Label>
                    <Form.Control
                        autoFocus
                        type="name"
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        autoFocus
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="name">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                        autoFocus
                        type="name"
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="name">
                    <Form.Label>Res Block and room number</Form.Label>
                    <Form.Control
                        autoFocus
                        type="name"
                        onChange={(e) => setResidence(e.target.value)}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>
                <Button onClick={() => Signup()} style={{ width: '200px', margin: '5px' }} block size="lg" type="submit">
                    Sign Up
                </Button>
            </Form>
        </div>
    )
    const renderAccount = () => (
        <div style={{ fontFamily: 'fantasy', marginTop: '60px' }}>
            <p>Feature Comming Soon...</p>
        </div>
    )

    const renderFooter = () => (
        <div></div>
    )

    const renderPay = () => (
        <div className="App">
            <div style={{width: '340px', padding: '0px'}} ref={paypal}></div>
        </div>
    )

    //Interface
    return (
        <div className="App">
            <nav class="navbar  navbar-header navbar-light bg-light justify-content-end" >
                <a onClick={() => setPage('products')} style={{ marginRight: '750px', fontSize: '30px', fontFamily: 'fantasy' }} class="navbar-brand"> VarsityCoffee.co.za</a>
                {userState === true && (<a onClick={() => logout()} style={{ float: 'right', fontFamily: 'fantasy', marginRight: '10px' }} href="#">logout</a>)}
                {userState === false && <a onClick={() => setPage('login')} style={{ float: 'right', fontFamily: 'fantasy', marginRight: '10px' }} href="#">Sign In</a>}
                {userState === false && <a onClick={() => setPage('register')} style={{ float: 'right', fontFamily: 'fantasy', marginRight: '10px' }} href="#"> |  Sign Up</a>}
                <a onClick={() => setPage('account')} style={{ float: 'right', fontFamily: 'fantasy', marginRight: '40px' }} href="#">|   My Account</a>
                <div style={{
                    position: 'absolute', height: 25, width: 25, borderRadius: 15, backgroundColor: 'rgba(95,197,123,0.8)', right: 15, top: 15, alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }} onClick={() => setPage('cart')}>
                    <p style={{ color: 'white', fontWeight: 'bold' }}>{getCartTotal()}</p>
                </div>
                <i style={{ paddingRight: '50px', borderRadius: 50 }} class="bi bi-cart"></i>
            </nav>
            <div style={{ backgroundColor: '	#0000FF', height: "55px" }}>
                {renderSearchArea()}
            </div>
            {page === 'products' && renderProducts()}
            {page === 'cart' && renderCart()}
            {page === 'checkout' && renderCheckout()}
            {page === 'login' && renderLogin()}
            {page === 'register' && renderRegister()}
            {page === 'account' && renderAccount()} 
        </div >
    );
}

export default App;


