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

# for desktop or web user to hit the api
get "/api/web/data.json" do
  content_type :json
  
    @lat = params[:lat]
    @lang = params[:lang]
    @limit = params[:limit]
    @from = params[:from]
    @to = params[:to]

    if @lat && @lang && @limit
      client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
      response = client.get('6zsd-86xi', {"$where" => "within_circle(location, #{@lat}, #{@lang}, #{@limit}) AND date > '#{@from}' AND date < '#{@to}' ","$limit"=>"200" })
      response.to_json 
    else
      @message ='{ "Error": { "status":400 , "message":"Please Specifiy the location co-ordinates and data limit" } }'
      @message.to_json 
    end
end

# for mobile user to hit the api
get "/api/mobile/data.json" do
  content_type :json
  
    @lat = params[:lat]
    @lang = params[:lang]
    @limit = params[:limit]
    @from = params[:from]
    @to = params[:to]
    @datalimit = params[:datalimit]

    if @lat && @lang && @limit
      client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
      response = client.get('6zsd-86xi', {"$where" => "within_circle(location, #{@lat}, #{@lang}, #{@limit}) AND date > '#{@from}' AND date < '#{@to}' ","$limit"=>"#{@datalimit}" })
      response.to_json 
    else
      @message ='{ "Error": { "status":400 , "message":"Please Specifiy the location co-ordinates and data limit" } }'
      @message.to_json 
    end
end