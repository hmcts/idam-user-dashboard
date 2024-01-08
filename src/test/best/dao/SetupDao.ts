const { I } = inject();

class SetupDAO {

    testingToken : string;

    setToken(tokenValue: string) {
      this.testingToken = tokenValue;
    }
  
    getToken() {
      if (this.testingToken) {
        console.log("testing token is set");
        return this.testingToken;
      }
      
      console.log("Testing token picking up value: " + process.env.SMOKE_TEST_USER_USERNAME)
  
  
    }

}

export = new SetupDAO();