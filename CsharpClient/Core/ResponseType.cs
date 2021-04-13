namespace CsharpClient
{
    public enum ResponseType
    {
        unknone,
        okey,
        usernameRequired,
        passwordRequired,
        nameRequired,
        usernameAlreadyExist,
        invalidJsonRequest,
        loginFail,
        tokenRequired,
        usernameNotFound,
        invalidId,
        contactAlreadyAdded,
        malformId,
        clientErr
    }
}