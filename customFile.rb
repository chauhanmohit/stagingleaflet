class Lib
  
  def dta(lat,lang,radius,zoom)
      if lat && lang && radius && zoom
          if zoom > '10' 
            @response = multiProcess(lat,lang,radius)
          else
            @response = getDataSet(lat,lang,radius)
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
    data = Parallel.map([testEndPoint(lat,lang,radius), testEndPoint1(lat,lang,radius)], in_threads: 2) do |collected_data|
      if collected_data == testEndPoint(lat,lang,radius)
        (collected_data).each do |i|
          response = Hash.new
          response[:type] = 'sex_offender'
          response[:sex_offender_id] = i.sex_offender_id
          response[:state_id] = i.state_id
          response[:name] = i.name
          response[:created_at] = i.created_at
          response[:soffender_longitude] = i.longitude
          response[:soffender_latitude] = i.latitude
          response[:address_1] = i.address_1
          response[:photo_url] = i.photo_url
          response[:age] = i.age
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
        end
      end
    end    
    respond_to do |format|
        format.json { render :json => data  }
    end
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