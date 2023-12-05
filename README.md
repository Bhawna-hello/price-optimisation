This code is written to scrape data from websites like 
https://gamenation.in/
https://gamenation.in/
https://www.amazon.in/ ( some third party api is used for the same) 

using npm dependencies like request and cheerio

usually when one needs to scrape data once or twice then it's better to run the code on local machine but price in several industries is something that keeps on updating frequently that's why it is better to automate the change using GCP pub sub feauture or some other services.

The code is written for more than 2000 products and involves several eternal https request so it is time consuming and that's why used GCP cloud run service as it supports conatiner run time of upto 24 hours. 

Code considers various variables like competitors price, availability, new price from amazon, inventory of store, popularity of product.
Here database is  GCP firestore.
