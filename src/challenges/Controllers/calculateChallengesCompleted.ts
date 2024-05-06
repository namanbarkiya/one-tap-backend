import { Controller } from "../../utils/interfaces/controller"
import { challengesDao } from "../Dao/challengesDao"
import { requirementFactory } from "../../utils/ChallengeRequirement/ChallengeRequirementFactory/RequirementFactory"
import { ChallengesInSameGame } from "../Types/types"
import { ChallengesNotInSameGame } from "../Types/types"
import { DotaUptoDateData } from "../../utils/ChallengeRequirement/GameClass/dotaRequirements"
import { VallorentUptoDateData } from "../../utils/ChallengeRequirement/GameClass/vallorentRequirements"
import { FortniteUptoDate } from "../../utils/ChallengeRequirement/GameClass/fortniteRequirements"

type completedChallenge ={
    gameId :string,
    userId : string,
    challengeId :string
}

const resolvePromiseBatchWise = async (promiseArray : Array<Promise<any>> , batchSize:number): Promise<any[]> =>{
    const len = promiseArray.length;
    let i =0;
    let currIdx = 0;
    const resultArray: Array<any> = [];
    while(i <len){
        let j=0;
        const batchPromiseArray : Array<Promise<any>> =[]
        while(j<batchSize){
            if(currIdx>=len) break;
            batchPromiseArray.push(promiseArray[currIdx])
            j++;
            currIdx++;
        }
        const result: Array<any> = await Promise.all(batchPromiseArray)
        result.forEach((dt)=>{
            resultArray.push(dt)
        })

        if(currIdx>=len) break;
        i=i+batchSize;
    }
    const batchPromiseArray : Array<Promise<any>> =[]
    while(currIdx<len){
        batchPromiseArray.push(promiseArray[currIdx])
        currIdx++;
    }
    const result: Array<any> = await Promise.all(batchPromiseArray)
    result.forEach((dt)=>{
        resultArray.push(dt)
    })
    return resultArray
}

export const calculateChallengesCompleted:Controller = async (req,res) =>{
    try{
        const userId = req.body.userId
        const gameId = req.body.gameId
        const gameData = req.body.gameData

        const sameGameChallengesPromise = challengesDao.getChallengesInSameGame(gameId)
        const notSameGameChallengesPromise = challengesDao.getChallengesNotInSameGame(gameId)
        const getCompletedChallengesPromise =  challengesDao.getCompletedChallenges(gameId,userId)
        
        let totalReward =0;
        
    

        const notCompChallSameGame :ChallengesInSameGame = [];
        const notCompChallNotSameGame :ChallengesNotInSameGame = [];
        try{
            
            const resolvedPromises = await Promise.all(
            
                [sameGameChallengesPromise , 
                notSameGameChallengesPromise , 
                getCompletedChallengesPromise]
                )
            const sameGameChallenges = resolvedPromises[0]
            const notSameGameChallenges = resolvedPromises[1]
            const getCompletedChallenges = resolvedPromises[2]

            // console.log("samegamechallenges" , sameGameChallenges)
            // console.log("notsamegameChallenge" , notSameGameChallenges)
            // console.log("completed challenges",getCompletedChallenges )
            
            notSameGameChallenges?.forEach((notSameGame)=>{
                let isPresent = false;
                getCompletedChallenges?.forEach((completedChallenge)=>{
                    const completedChallengeId = completedChallenge.challengeId
                    if(notSameGame.id === completedChallengeId){
                        isPresent = true
                    }
                })
                if(!isPresent)
                notCompChallNotSameGame.push(notSameGame)
            })
            

            sameGameChallenges?.forEach((sameGame)=>{
                let isPresent = false;
                getCompletedChallenges?.forEach((completedChallenge)=>{
                    const completedChallengeId = completedChallenge.challengeId
                    if(sameGame.id === completedChallengeId){
                        isPresent = true
                    }
                })
                if(!isPresent)
                notCompChallSameGame.push(sameGame)
            })

        }
        catch(err){
            console.log(err);
            console.log("Data Not able to fetch")
        }
        
        // console.log( "Not completed Challenges",notCompChallNotSameGame ,notCompChallSameGame )

        const completedChallenges: Array<any> = [];
        const completedChallengesServer : Array<any> = [];

        const challengeProvider = requirementFactory.getRequirement(gameId)
        const completedChallengeSameGame :Array<completedChallenge> = []
        // console.log("same_gmae_challenge" ,sameGameChallengesPromise )
        // console.log(notCompChallSameGame , "test")
        
        notCompChallSameGame.forEach((challenge)=>{
            // console.log("inside the foreach")
           const requirements = challenge.requirements
           const challengeId = challenge.id
           const isComp = challengeProvider?.checkIfReqMeet( gameData,requirements)
            if(isComp){
                completedChallengeSameGame.push({gameId , userId ,challengeId})
                totalReward+= challenge.reward
            }
        })

        // console.log("completed challenges same game" ,completedChallengeSameGame)


        completedChallengeSameGame.forEach((ch)=>{
            completedChallenges.push({gameId : ch.gameId ,challengeId:  ch.challengeId ,userId: ch.userId})
        })

        const data = await challengeProvider!.updateMatchDetails(gameData, userId)
        // console.log("updated data" , data);
        const promiseArrayNotSameGame: Array<Promise<any>> = []
        
        // console.log("this is it", notCompChallNotSameGame);

        notCompChallNotSameGame.forEach((ch)=>{
            console.log("Time" , ch.startTime ,ch.endTime,userId)
            const promise = challengeProvider!.getDataUptoDate(ch.startTime ,ch.endTime,userId)
            promiseArrayNotSameGame.push(promise);
        })

        
        const matchDetails = await resolvePromiseBatchWise(promiseArrayNotSameGame , 3)
        
        // console.log("MATCH details" , matchDetails);

        const progress : Array<any> = []

        // console.log("notsamegamechallenge" , notCompChallNotSameGame)

        const updateProgressArray : Array<any>= [] 
        const progressMp = new Map<number , number> ();
        notCompChallNotSameGame.forEach((ntComplete ,i)=>{
            const requirement = ntComplete.requirements
            console.log("match details" ,matchDetails[i].length , requirement , i )

            const total = challengeProvider!.calculateTotal(matchDetails[i] , requirement)
            const totalAny = total as any 
            // console.log("totalAny" , totalAny);
            const {isCompleted , percentage}= challengeProvider!.checkIfReqMeet(totalAny , requirement)
            progressMp.set(ntComplete.id , percentage);
            if(isCompleted){
                completedChallenges.push({gameId ,challengeId:  ntComplete.id ,userId})
                totalReward += ntComplete.reward
                updateProgressArray.push({requirement : total , challengeId: ntComplete.id ,isCompleted : true ,userId})
            }else{
                updateProgressArray.push({requirement : total , challengeId: ntComplete.id , isCompleted :false , userId})
            }
        })
        
        // console.log("check check" ,  progress ,completedChallenges , totalReward )

        const result = await challengesDao.updateChallengesCompleted(completedChallenges)
        let  coins = 0;
        
        if(totalReward >0)
        coins = await challengesDao.updateTotalCoins(userId , totalReward);

        const getCompletedChallengePromiseArray : Array<Promise<any>>= [] 

        result.forEach((res : any)=>{
            const challengeId = res.challengeId;
            const promise = challengesDao.getCompletedChallengeById(challengeId);
            getCompletedChallengePromiseArray.push(promise);
        })

        const completedChall = await resolvePromiseBatchWise(getCompletedChallengePromiseArray,3);

        // console.log("progress" ,updateProgressArray ,coins)
        
        let updateProgress = []
        if(updateProgressArray.length>0){
            updateProgress = await challengeProvider!.upsertProgress(updateProgressArray)
        }
        
        const progressWithPercentage = updateProgress.map((p)=>{
            const id = p.id ;
            const percentage = progressMp.get(id)
            return {...p , percentage}
        })

        res.status(200).json({progressWithPercentage , balance : coins , challenges : completedChall})
        
    }catch(err){
        console.log(err)
        res.status(500).json("server error")
    }

}