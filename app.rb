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

## for desktop or web user to hit the api for post request
#post "/api/web/data.json" do
#  content_type :json
#    request.body.rewind
#    req = JSON.parse request.body.read
# 
#    @lat = req['data']['lat']
#    @lang = req['data']['lang']
#    @limit = req['data']['limit']
#    @from = req['data']['from']
#    @to = req['data']['to']
#    @type = req['data']['type']
#    @arrest = req['data']['arrest']
#
#    if @lat && @lang && @limit
#      client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
#      response = client.get('6zsd-86xi', {"$where" => "within_circle(location, #{@lat}, #{@lang}, #{@limit}) AND date > '#{@from}' AND date < '#{@to}' ","$limit"=>"200","primary_type"=>"#{@type}","arrest"=>"#{@arrest}" })
#      response.to_json 
#    else
#      @message ='{ "Error": { "status":400 , "message":"Please Specifiy the location co-ordinates and data limit" } }'
#      @message.to_json 
#    end
#end

## for desktop or web user to hit the api for get request
get "/api/web/data.json" do
  content_type :json
 
    @lat = params[:lat]
    @lang = params[:lang]
    @limit = params[:limit]
    @from = params[:from]
    @to = params[:to]
    @type = params[:type]
    @arrest = params[:arrest]
    crimeType = params[:type].split(',')

    if @lat && @lang && @limit
      client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
      response = client.get('6zsd-86xi',
                              {
                              "$where" => "within_circle(location, #{@lat}, #{@lang}, #{@limit}) AND
                                           date > '#{@from}' AND date < '#{@to}' And
                                           (primary_type = '#{crimeType[0]}' OR primary_type = '#{crimeType[1]}'
                                             OR primary_type = '#{crimeType[2]}' OR primary_type = '#{crimeType[3]}'
                                            )",
                              "$limit"=>"200",
                              "arrest"=>"#{@arrest}",
                              }
                            )
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
