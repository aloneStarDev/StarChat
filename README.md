# StarChat

Objects
    Message 
        + id        string      64 character hex, auto increament
        + content   string      file id or message text
        + type      string      enum(text,image,video,audio)
        + seen      bool    
        + author    string      user_id 
        + contact   string      contact_id
        + date      IsoDate     full date of save message in database
        - replay    string      id of message that reply on it
        - forward  string      id of message that forward on it
        - caption   string      this work just for none text message
        - updated   bool
        - deleted   bool

    File 
        + id        string      64 character hex, auto increament
        + mimeType  string      
        + type      string      enum(text,image,video,audio)
        + path      string      path of storage
        
    Session
        + id        string      64 character hex, auto increament
        + ip        string 
        + user      string      user id
        + date      IsoDate     login time

    User
        + id        string      64 character hex, auto increament
        + name      string     
        + username  string
        + secret    string
        + lastseen  IsoDate     
        + state     string      enum(online,offline)
        - profile   string      path of media
        - phone     string   
        - email     string   
        - biography string 
    
    Contact
        + id        string      64 character hex, auto increament
        + user      string      user id
        + peer      string      contact id
        + username  string      contact username
        + name      string      name that user called to peer by defualt is peer name
        + mute      bool
        + stranger  bool
        - clh       IsoDate     time to clear history 


WebSocket API
        Requests Format :JSON {
            method,
            ...(other parameter mentioned in each method )
        }   
        Response Format :JSON {
            data:object,
            log:string[],
            ok:bool,
            type:string,
            err:string[],
            method:string
        }

        public responses
            {
                ok:
                    false
                err:
                    ["unauthorize connection","server error","invalidJsonRequest"]
                type:
                    "basic"
            },
            {
                ok:true
            }
            
Methods

*   login
        @param 
            + uid       string      user id
            + sid       string      session id
    --->
        @resp
            + log       "connected"
            + err       ["uid Required","sid Required","invalid uid","invalid sid","uid is 24 character","sid is 24 character"]
   
    
*   logout

*   contact.add
        @param
            + uid       string      user id of contact
    --->
        @resp
            + data      {id,uid,name,username,mute,stranger,state,lastseen?,profile?}  
            + log       "already in your contacts";  
            + err       ["uid required","invalid uid"]    

*   contacts.get
    --->
        @resp
            + data      [{id,uid,name,username,mute,stranger,state,lastseen?,profile?},...]    contacts array

*   contact.remove
        @param
            + uid       string       contact id
    --->
        @resp
            + err       ["uid required","invalid uid"]
    
*   messages.get
        @param
            + uid       string       contact user id
            - mid     string       we have optional message id that used start of offset 
            - count     int          count of messages from offset                             
    --->
        @resp
            + data      [{id,content,type,seen,author,contact,date,replay?,forwarad?,caption?,updated?},...]
            + err       ["uid required","invalid uid","invalid mid","invalid count"]
*   messages.seen
        @param
            + msgs      [string,...]       array of message id of seened message 
    --->
        @resp
            + data      {contact,autor,msgs}
                                           array of message id of seened messages
                                           send back to response with uid of peer
                                           contact: user id of contact
                                           author:  user id of author
                                           msgs: array of message id 

            + err       ["msgs required","msgs should be array","invalid msgs item"]
        
        @update
            + type      "seen"
            + data      [contacts,author,msgs] 

*   message.send
        @param
            - token     string      this token used to send
                                    back for async validation
                                    of message in client 
            + content   string      if is a binary file
                                    should be hash of file
            + type      string
            + contact   string       contact id
            - reply     string       message id
            - forward   string       message id
            - caption   string       
    --->    
        @resp
            + data      {id,token,contact}       
            + err       ["invalid contact"]
    --->
        @update
            + type      "message"
            + data      Message
    --->
        @update
            + type      "contact.add"       when author of massage be stranger
            + data      Contact
            

                   
*   users.search
        @param
            + query     string      query must be a substring of username 
    --->
        @resp
            + data      [{id,username,name,profile}]
            + err       ["usernameRequired"]


