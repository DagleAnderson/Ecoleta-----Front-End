import React,{useEffect, useState, ChangeEvent, FormEvent} from 'react';
import './styles.css';
import {FiArrowLeft} from 'react-icons/fi';
import {Map,TileLayer,Marker} from 'react-leaflet';
import {LeafletMouseEvent} from 'leaflet';
import axios from 'axios';

import api from '../../services/api';

import {Link, useHistory} from 'react-router-dom';

import logo from '../../assets/logo.svg';

interface Item{
    id:number;
    title:string;
    image_url:string;
};

interface IBGEUfResponse{
    sigla:string;
};

interface IBGECityResponse{
    nome:string;
};

const CreatePoint = () =>{
    const history = useHistory();

    const[items,setItems] = useState<Item[]>([]);
    const[ufs ,setUfs] = useState<string[]>([]);
    const[cities,setCities] = useState<string[]>([]);

    const[selectedUf,setSelectedUf] = useState('0');
    const[selectedCity,setSelectedCity] = useState('0');
    const[initialPosition,setInitialPosition] = useState<[number,number]>([0,0]);
    const[selectedPosition,setSelectedPosition] = useState<[number,number]>([0,0]);
    const[selectedItens,setSelectedItens]= useState<number[]>([]);

    const[formData,setFormData] = useState({
        name:'',
        email:'',
        whatsapp:''
    });
  
    useEffect(()=>{ // Posição inicial do usuário 
        navigator.geolocation.getCurrentPosition(position=>{
        const{latitude,longitude} = position.coords;

        setInitialPosition([latitude,longitude]);
        });
    },[]);


    useEffect(() => {//Consumindo da API local configurada com axios usando baseURL:http://localhost:3333
        api.get('items').then(response =>{
            setItems(response.data);
        });
    },[]);

    useEffect(()=>{ //Consumu da IPI do IBGE - UF
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
           const ufInitials = response.data.map( uf => uf.sigla);
           setUfs(ufInitials);
        });
    },[]);

    useEffect(()=>{//Consumu da IPI do IBGE - Cidades
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response=> {
            const cities = response.data.map(city => city.nome);

            console.log(cities);
            setCities(cities);
        });
    },[selectedUf]);

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){//Função de onChange em UF
        const uf = event.target.value;
        
    setSelectedUf(uf);
    };

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){//Função de onChange em Cidade
        const city = event.target.value;
        
    setSelectedCity(city);
    };

    function handleMapOnClick(event : LeafletMouseEvent){ //Função de Click no mapa Leaf
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    };

    function handleInputChange(event:ChangeEvent<HTMLInputElement>){ //Pega dados dos input
        //const name = event.target.value;
          const{name,value} = event.target;
         
          setFormData({...formData,[name]:value})
         // setFormData({...formData,[name]:event.target.value});//Spread Operator (...) - Copia os dados ja existentes na função principal
    }
    
    function handleSelectItem(id:number){ //observa ação de itens selecionados
        
        setSelectedItens([id]);
        const alreadySeleted = selectedItens.findIndex(item =>item === id);

        if(alreadySeleted>= 0){
            const filteredItens = selectedItens.filter(item=>item !== id);
            
            setSelectedItens(filteredItens);
        }else{
            setSelectedItens([...selectedItens,id]);
        } 
    
    }

   async function handleSubmit(event:FormEvent){//Fazer submit para api
        //FormEvent evita o reload padrão do HTML
        event.preventDefault();

        const{name,email,whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const[latitude,longitude] = selectedPosition;
        const items = selectedItens;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };

        await api.post('points',data);

        alert('Ponto de coleta cadastrado');
        history.push("/");
    }


    return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to='/'>
                    <FiArrowLeft/>
                    Voltar  para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                    <h1>Cadastro do <br/> Ponto de Coleto</h1>
                    <fieldset>
                        <legend>
                            <h2>Dados</h2>
                        </legend>
                        
                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input 
                                type="text"
                                name="name"
                                id="name"
                                placeholder=" Ponto de coleta"
                                onChange={handleInputChange}                                   
                                />
                        </div>
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="name">Email</label>
                                <input 
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder=" exemplo@exemplo.com"      
                                    onChange={handleInputChange}                             
                                    />
                            </div>
                            <div className="field">
                                <label htmlFor="name">Whatsapp</label>
                                <input 
                                    type="text"
                                    name="whatsapp"
                                    id="whatsapp"
                                    placeholder=" (xx) xxxxx-xxxx"  
                                    onChange={handleInputChange}                                 
                                    />
                            </div>
                        </div>

                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2>Endereço</h2>
                            <span>Selecione o endereco no mapa</span>
                        </legend>
                        <Map center={initialPosition} zoom={15} onclick={handleMapOnClick}> 
                            <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={selectedPosition}/>
                        </Map>
                        <div className="field">
                            <label htmlFor="endereco">Endedeço</label>
                            <input 
                                type="text"
                                name="endereco"
                                id="endereco"
                                placeholder=" ex: rua nairobe nº 100" 
                                onChange={handleInputChange}                                  
                                />
                        </div>
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="Cidade"></label>
                                <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                    <option value="0">Selecione uma cidade</option>
                                    {cities.map(city => {
                                        return(
                                            <option key={city} value={city}>{city}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="uf"></label>
                                <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf} >
                                    <option value="0">Selecione uma UF</option>
                                    {ufs.map(uf =>{
                                        return(
                                        <option key={uf} value={uf}>{uf}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2>Itens de Coleta</h2>
                            <span>Selecione um ou mais itens abaixo</span>
                        </legend>
                         <ul className="items-grid">
                             {items.map(item=>{
                                return(
                                <li 
                                key={item.id} 
                                onClick={()=>handleSelectItem(item.id)}
                                className={selectedItens.includes(item.id) ? 'selected' : ''}
                                >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>)
                             })}
                            

                         </ul>
                    </fieldset>
                    
                    <button type="submit">Cadastrar ponto de coleta</button>

                </form> 
        </div>
    );
}

export default CreatePoint;