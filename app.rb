# app.rb

require 'sinatra'
require 'json'
require './environments'
require 'soda/client'
require 'parallel'
#enable :sessions

class Lib
  
  def data(lat,lang,radius,zoom)
      if lat && lang && radius && zoom
          if zoom.to_i < 11
            @response = getDataSet(lat,lang,radius)
          else
            @response = multiProcess(lat,lang,radius) 
          end
        return @response
        #respond_to do |format|
        #  format.json { render :json => @response }
        #end
      else  
        return '{ "Error": { "status":400 , "message":"Please Specifiy the location co-ordinates and data limit" } }'
        #respond_to do |format|
        #  format.json { render :json => message }
        #end 
      end
  end
  
  def multiProcess(lat,lang,radius)
    @data = Array.new
    Parallel.map([testEndPoint(lat,lang,radius), testEndPoint1(lat,lang,radius)], in_threads: 2) do |collected_data|
      if collected_data == testEndPoint(lat,lang,radius)
        (collected_data).each do |i|
          response = Hash.new
          response[:type] = 'sex_offender'
          response[:sex_offender_id] = i.sex_offender_id
          response[:state_id] = i.state_id
          response[:name] = i.name
          response[:created_at] = i.created_at
          response[:longitude] = i.longitude
          response[:latitude] = i.latitude
          response[:address_1] = i.address_1
          response[:photo_url] = i.photo_url
          response[:age] = i.age
          @data.push(response)
        end
      elsif collected_data ==  testEndPoint1(lat,lang,radius)
        (collected_data).each do |e|
          response = Hash.new
          response[:type] = 'crime'
          response[:arrest] = e.arrest
          response[:case_number] = e.case_number
          response[:date] = e.date
          response[:description] = e.description
          response[:location_description] = e.location_description
          response[:latitude] = e.latitude
          response[:longitude] = e.longitude
          response[:id] = e.id
          response[:primary_type] = e.primary_type
          @data.push(response)
        end
      end
    end    
    return @data 
  end
  
  def testEndPoint(lat,lang,radius)
    client = SODA::Client.new({ :domain => 'moto.demo.socrata.com', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
    response = client.get('56a3-9w2u', {
                            "$select" => "*",
                            "$where" => "within_circle(location, #{lat}, #{lang}, #{radius})"}
                        )
    return response
  end
  
  
  def testEndPoint1(lat,lang,radius)
    client = SODA::Client.new({ :domain => 'data.cityofchicago.org', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
    response1 = client.get('6zsd-86xi',
                              {"$select" => "arrest,case_number,date,description,location_description,latitude, longitude, primary_type, id",
                              "$where" => "within_circle(location, #{lat}, #{lang}, #{radius})",
                              "$limit"=>"1200",
                              }
                            )
    return response1
  end
  
  def getDataSet(lat,lang,radius)
    client = SODA::Client.new({ :domain => 'moto.demo.socrata.com', :app_token => 'v1SkHrbzQcyFmlkL9D5W1UXfT' })
    response = client.get('fnby-edd9', {
                            "$select" => "*"
                          } 
                        )
    return response
  end
  
end

# get ALL posts
get "/" do 
  erb :"posts/index"
end

## for desktop or web user to hit the api for get request
get "/api/web/data.json" do
  content_type :json
    a = Lib.new 
    lat = params[:lat]
    lang = params[:lang]
    radius = params[:radius]
    zoom = params[:zoomLevel]
    
    #response = 
    response = a.data(lat,lang,radius,zoom)
    response.to_json
end


