# app.rb

require 'sinatra'
require 'json'
require './environments'
require 'soda/client'
#enable :sessions



# get ALL posts
get "/" do
  erb :"posts/index"
end

get "/showData" do
    @lat = params[:lat]
    @lang = params[:lang]
    @limit = params[:limit]

    if @lat && @lang && @limit
      client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
      response = client.get('6zsd-86xi', {"$where" => "within_circle(location, #{@lat}, #{@lang}, #{@limit})","$limit"=>"500"})
      response.to_json 
    else
      @message ='{ "Error": { "status":400 , "message":"Please Specifiy the location co-ordinates and data limit" } }'
      @message.to_json 
    end
    
end

