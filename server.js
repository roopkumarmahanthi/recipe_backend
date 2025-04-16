const cors=require("cors");
const express= require("express");
const bodyparser=require("body-parser");
const axios =require("axios");
const dotEnv =require("dotenv");
//const {OpenAI} =require("openai");
const app=express();
dotEnv.config();
//const API_KEY = process.env.API_KEY;
// const openai = new OpenAI({
//     apiKey:"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",
// });
//const openai =new OpenAIApi(config);

const port =process.env.PORT || 8081;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.get('/searchIngredient', async (req,res) =>{
     try{
        const  {RecipeName} =req.query;
        console.log(RecipeName);

              const response= await axios.post("https://openrouter.ai/api/v1/chat/completions",   
                {
                    model : "deepseek/deepseek-r1:free",
                    messages : [{role : "user", content : `give the recipe for ${RecipeName} . 
                        Ensure Structure the response as given example :
                           Ingredients:
                              
                              Cooked rice = 3 cups (600g) = 30 = 50/kg
                              Vegetable oil = 2 tbsp (30ml) = 6 = 200/liter
                              Eggs = 2 (100g) = 20 = 200/dozen
                              Note1: prefer gram/ml measurements along with cups/tbsp.
                              Note2: allocate exact price(no ranges) according to the quantity in Indian currency and strictly don't give "₹".
                           Steps:
                            1. Heat 1 tbsp oil in a wok or large skillet over medium-high heat. Add beaten eggs and scramble until cooked. Remove and set aside.
                            2. Add remaining oil to the pan. Sauté garlic and white parts of green onions until fragrant (about 30 seconds).
                           Warning:just leave this field empty.
                        Note : if the given RecipeName is Not Edible(we can eat or drink them) then 
                               Ensure Structure the response as given example :
                                 Ingredients:
                                 Steps:
                                 Warning:given response not might be a Edible(we can eat or drink them).
                       
                         `}],
                },
                {
                    headers :{
                        Authorization : 'Bearer ${process.env.API_KEY}',
                        "Content-Type": "application/json",
                    },
                }
              );
            console.log(response.data.choices?.[0]?.message?.content|| 'No response received.123')
            // if we not received any response :
            if(!response.data.choices?.[0]?.message?.content){
                console.warn("no response received");
                return res.json({
                    recipe : "",
                    ingredients :[],
                    steps : [],
                    warning : "no response received",
                })
            }
             //assume that response is in required formate :
            const result= response.data.choices?.[0]?.message?.content;
            const [IngredientsPart, StepsPart1] = result.split("Steps:");
            const [StepsPart,Warning]=StepsPart1.split("Warning:");
            //console.log(Warning);
            if(Warning){
                console.log(Warning);
                return res.json({
                    recipe : "",
                    ingredients :[],
                    steps : [],
                    warning : Warning,
                })
            }
            //console.log(IngredientsPart,StepsPart)
            const IngredientsList =IngredientsPart
                                   .replace("Ingredients:","")
                                   .trim()
                                   .split("\n")
                                   .map( (item) =>{
                                         const [Ingredient,Quantity,Price,PricePerHead] = item.split("=");
                                         return {ingredient : Ingredient.trim(), quantity : Quantity ? Quantity.trim() : "N/A", price : Price.trim(),priceperhead :PricePerHead ? PricePerHead.trim() : "N/A"};
                                   });
            //console.log(IngredientsList)
            const StepsList =StepsPart
                             .trim()
                             .split("\n")
                             .map( (step)=>{
                                return step.trim();
                             });
            //console.log(StepsList);
            const StructuredResult ={
                recipe : RecipeName,
                ingredients :IngredientsList,
                steps : StepsList,
                warning : "",
            };
            //console.log(StructuredResult)
            res.json(StructuredResult);  
     }catch(e){
        console.error("Error:", e.response ? e.response.data : e.message);
        res.json({ message: "not working", error: e.response?.data || e.message });
     }
})

app.listen(port ,() =>{
    console.log("Listening at 8081");
});
