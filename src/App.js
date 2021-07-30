import './App.css';
import React, { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { DropdownButton, Dropdown, Button, Col, Row, Image } from 'react-bootstrap'
import api from './api/axios';
import gif from './assets/cart.gif'

function App() {
    //state variables
    const [products, setProduct] = useState([])
    const [cart, setCart] = useState([])
    const [search, setSearch] = useState('')
    const [page, setPage] = useState('products')
    let   [show, setShow] = useState(false)

    var listof10 = [
        'PT’s Coffee: Best dark roast', 'Angels’ Cup: Best Arabica', 'Angels’ Cup: Best Arabica'
        , 'Lavazza: Best Italian', 'Don Francisco’s: Best-flavoure', 'Caribou Coffee: Best light roast'
        , 'Folgers: Best USA coffee brand', 'Cafe Don Pablo: Best low acid', 'Bizzy Organic: Best cold brew'
        , 'Nescafe Azera Intenso: Best instant coffee'
    ]

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
    }, [])

    if (!products) {
        return null;
    }

    const AddToCart = (product) => {
        let newCart = [...cart]
        let itemInCart = newCart.find((item) => product.productId === item.productId)
        if(itemInCart) {
            itemInCart.quantity ++
        }else{
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
        try {
            api.post('/api/orders', { totalPrice: getTotalSum(), orderStatus: false }).then((res) => {
            })
            cart.map((orderItem) => {
                api.get('/api/orders').then((i) => {
                    var orId = i.data[i.data.length - 1]
                    console.log(orId)
                    api.post('/api/orderitems', { orderId: orId.orderId + 1, productId: orderItem.productId, quantity: orderItem.quantity }).then((data) => {
                        console.log('sucessfully posted orderitem data')
                    }).catch((err) => console.log(err))
                })

            })
            setShow(true)

        } catch (err) {
            console.log(err);
        }
    }

    const getTotalSum = () => {
        return cart.reduce((sum, { productPrice,quantity }) => sum + productPrice * quantity, 0)
    }

    const getCartTotal = () => {
        return cart.reduce((sum, {quantity})=>sum + quantity, 0)
    }

    const increment = (i)=>{
      setQuantity(i, i.quantity +1)
    }

    const decrement = (d) =>{
       setQuantity(d, d.quantity -1)
    }
    const setQuantity = (product, amount) => {
        let newCart = [...cart]
        newCart.find((item)=>
            item.productId === product.productId
        ).quantity = amount;
        setCart(newCart)
    }


    //RENDER UI COMPONENTS METHODS
    const renderProducts = () => (
        <div style={{ padding: '10px', margin: '10px' }}>
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
                    <Row>
                        <Col sx lg="8">
                            {
                                cart.map((product) => {
                                    return (
                                        <div>
                                            <div class="card" style={{ width: '950px', padding: '5px', marginLeft: '40px', marginTop: '20px', marginBottom: '15px' }} key={product.productId}>
                                                <Row>
                                                    <Col sx lg="2">
                                                        <img style={{ width: '160px', height: '160px', alignContent: 'space-around' }} src={"http://localhost:8000/public/" + product.productImage} alt={product.productName} />
                                                    </Col>
                                                    <Col>
                                                        <div style={{ fontFamily: 'fantasy', fontSize: '18.5px', flex: 'row' }} class="card.body">
                                                            <Row>
                                                                <Col>
                                                                    <p style={{ textAlign: 'justify', fontSize: "28px" }} class="card.title" >{product.productName} {product.packSize}    </p>
                                                                </Col>
                                                                <Col>
                                                                    <p style={{ textAlign: 'right', fontSize: '28px' }} class="card.text">R{product.productPrice}</p>
                                                                    <Row>
                                                                        <Col>
                                                                        <Button onClick={() => increment(product)} variant="btn btn-primary" style={{ fontFamily: 'fantasy', fontSize: '12px', marginLeft: '700px' }}>
                                                                                +
                                                                            </Button>
                                                                        </Col>
                                                                        <Col>
                                                                        <Button variant="secondary" style={{ fontFamily: 'fantasy', fontSize: '14px', marginLeft: '700px',marginTop:'2px' }}>
                                                                                {product.quantity}
                                                                            </Button>
                                                                        </Col>
                                                                        <Col>
                                                                            <Button onClick={() => decrement(product)} variant="btn btn-primary" style={{ fontFamily: 'fantasy', fontSize: '12px', marginLeft: '700px',marginTop:'2px' }}>
                                                                                -
                                                                            </Button>
                                                                        </Col>
                                                                       
                                                                    </Row>
                                                                </Col>
                                                            </Row>

                                                            <p style={{ textAlign: 'left', fontSize: '12px', padding: '5px' }} class="card.text">{product.discription}</p>
                                                            <p style={{ textAlign: 'right', marginRight: '10px' }} variant="secondary" size="md" onClick={() => RemoveFromCart(product)}>Remove</p>
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
                                           { <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginLeft: '50px', marginTop: '50px', textAlign: 'center' }} class="card.text">Total(item {getCartTotal()})</p>}
                                        </Col>
                                        <Col>
                                            {getTotalSum() !== 0 ? <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginRight: '0px', marginTop: '50px' }} class="card.text"> R{getTotalSum()}</p> : <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginRight: '0px', marginTop: '50px' }} class="card.text"> R0,00</p>}
                                        </Col>
                                    </Row>
                                    <Button onClick={() => sendOrder()} style={{ alignSelf: 'end' }} variant="btn btn-primary" size="md" >Proceed To CheckOut</Button>
                                </div>
                            </div>
                            <div class="card" style={{ width: '360px', padding: '20px', marginLeft: '20px', marginTop: '10px' }}>

                                <div style={{ fontFamily: 'fantasy', fontSize: '16.5px', textAlign: 'start', fontWeight: 'lighter' }} class="card.body">
                                    <p class="card-title">Secure checkout</p>
                                    <p class="card.text">May Ways To Pay</p>
                                    <p class="card.text">Reliable Delivery</p>
                                </div>
                            </div>
                            {show === true && cart.length !== 0 ? <p style={{ fontFamily: 'fantasy', fontSize: '18.5px', marginRight: '60px', marginTop: '30px', color: 'red' }}>Thank You for Shopping @Varsity Coffee Store</p> : ""}
                        </Col>
                    </Row>
                </div>
            ) : NoItem()
        )
    }

    const renderSearchArea = () => (

        <div style={{ padding: '10px', margin: '10px', fontFamily: 'fantasy' }}>
            <h1 style={{ margin: '20px' }}>Search for coffee below</h1>
            <input tyle={{ margin: '20px' }} type="search" class="form-control" placeholder="Search" aria-label="Search"
                aria-describedby="search-addon" placeholder="Search here..." onChange={(e) => {
                    setSearch(e.target.value);
                }} />

            <h5 style={{ marginTop: '15px', color: 'blue' }}>The 10 best coffee beans</h5>
            {listof10.map((l) => {
                return (
                    <p style={{ marginTop: '8px', fontSize: '16px' }}>{l}</p>
                )
            })}
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
        <div lassName="">
        </div>
    )

    //Interface
    return (
        <div className="App" style={{ backgroundColor: '#F8F8F8' }}>
            <nav style={{ padding: '10px' }} class="navbar  navbar-expand-lg navbar-dark bg-dark justify-content-between" >
                <a onClick={() => setPage('products')} style={{ padding: '10px', fontSize: '30px', fontFamily: 'fantasy' }} class="navbar-brand"> VarsityCoffee.co.za</a>
                <h5 onClick={() => setPage('cart')} class="my-2 my-sm-0 btn btn-primary" style={{ color: 'white', padding: '2px', marginRight: '10px' }}><i style={{ padding: '10px', borderRadius: 50 }} class="bi bi-cart"></i>({getCartTotal()})</h5>
            </nav>

            <Row>
                <Col md lg="3" >
                    {page !== 'cart' ? renderSearchArea() : ""}
                </Col>
                <Col>
                    {page === 'products' && renderProducts()}
                </Col>
            </Row>
            {page === 'cart' && renderCart()}
            {page === 'checkout' && renderCheckout()}

        </div >
    );
}

export default App;


